import type { Payload } from 'payload'

import {
  ADDRESS_CLUSTER_PHONE_THRESHOLD,
  ADDRESS_CLUSTER_WINDOW_MS,
  HIGH_COD_AMOUNT_MINOR,
  NEW_ACCOUNT_WINDOW_MS,
  PHONE_VELOCITY_THRESHOLD,
  PHONE_VELOCITY_WINDOW_MS,
  REFERRAL_ORDER_WINDOW_MS,
  RISK_FLAG_WEIGHTS,
} from '@/lib/risk/config'
import {
  normalizeAddressKey,
  normalizeRiskPhone,
  phoneSearchVariants,
} from '@/lib/risk/normalizeRiskPhone'
import { buildRiskScoreResult } from '@/lib/risk/scoreLevel'
import type { RequestContext, RiskFlag, RiskScoreResult } from '@/lib/risk/types'
import type { Order, User } from '@/payload-types'

const DELIVERED_STATUSES = new Set(['delivered', 'completed'])
const BAD_STATUSES = new Set(['cancelled', 'refunded'])

const WEAK_ADDRESS_PATTERN = /^(test|asdf|abc|xyz|demo|fake|sample|\d+)$/i

function resolveRelationId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'object' && value !== null && 'id' in value) {
    const id = (value as { id: unknown }).id
    if (typeof id === 'number' && Number.isFinite(id)) return id
  }
  return null
}

function phoneMatchesVariants(stored: string | null | undefined, variants: string[]): boolean {
  const normalized = normalizeRiskPhone(stored)
  if (!normalized) return false
  return variants.some(
    (variant) =>
      normalized === variant || normalized.endsWith(variant) || variant.endsWith(normalized),
  )
}

async function resolveOrderPaymentMethod(
  payload: Payload,
  order: Order,
): Promise<'cash-on-delivery' | 'stripe' | null> {
  const transactionIds = (order.transactions ?? [])
    .map((entry) => resolveRelationId(entry))
    .filter((id): id is number => id !== null)

  if (transactionIds.length === 0) return null

  const transactions = await payload.find({
    collection: 'transactions',
    depth: 0,
    limit: transactionIds.length,
    overrideAccess: true,
    where: {
      id: {
        in: transactionIds,
      },
    },
  })

  return transactions.docs.find((tx) => tx.paymentMethod)?.paymentMethod ?? null
}

async function findRecentOrdersByPhone(args: {
  payload: Payload
  phone: string
  sinceIso: string
  excludeOrderId?: number
}): Promise<Order[]> {
  const variants = phoneSearchVariants(args.phone)
  if (variants.length === 0) return []

  const result = await args.payload.find({
    collection: 'orders',
    depth: 0,
    limit: 100,
    overrideAccess: true,
    where: {
      and: [
        { createdAt: { greater_than_equal: args.sinceIso } },
        { customerPhone: { exists: true } },
      ],
    },
  })

  return result.docs.filter((order) => {
    if (args.excludeOrderId != null && order.id === args.excludeOrderId) return false
    return phoneMatchesVariants(order.customerPhone, variants)
  })
}

async function findOrdersByPhoneHistory(args: {
  payload: Payload
  phone: string
  excludeOrderId?: number
}): Promise<Order[]> {
  const variants = phoneSearchVariants(args.phone)
  if (variants.length === 0) return []

  const result = await args.payload.find({
    collection: 'orders',
    depth: 0,
    limit: 200,
    overrideAccess: true,
    where: {
      customerPhone: { exists: true },
    },
    sort: '-createdAt',
  })

  return result.docs.filter((order) => {
    if (args.excludeOrderId != null && order.id === args.excludeOrderId) return false
    return phoneMatchesVariants(order.customerPhone, variants)
  })
}

async function loadCustomerUser(payload: Payload, customerId: number | null): Promise<User | null> {
  if (customerId == null) return null

  try {
    return (await payload.findByID({
      collection: 'users',
      depth: 0,
      id: customerId,
      overrideAccess: true,
    })) as User
  } catch {
    return null
  }
}

function isWeakAddress(fullAddress: string | null | undefined): boolean {
  const trimmed = fullAddress?.trim()
  if (!trimmed) return true
  if (trimmed.length < 8) return true
  if (WEAK_ADDRESS_PATTERN.test(trimmed)) return true
  if (/^\d+$/.test(trimmed.replace(/\s/g, ''))) return true
  return false
}

export async function scoreOrderRisk(args: {
  payload: Payload
  order: Order
  requestContext?: RequestContext
}): Promise<RiskScoreResult> {
  const { payload, order, requestContext } = args
  const flags: RiskFlag[] = []
  const customerId = resolveRelationId(order.customer)
  const linkedPaymentMethod = await resolveOrderPaymentMethod(payload, order)
  const paymentMethod =
    linkedPaymentMethod ?? (!customerId ? ('cash-on-delivery' as const) : null)
  const phone =
    order.customerPhone ??
    (customerId != null ? ((await loadCustomerUser(payload, customerId))?.phone ?? null) : null)

  if (!customerId && paymentMethod === 'cash-on-delivery') {
    flags.push({
      flag: 'guest_cod_checkout',
      weight: RISK_FLAG_WEIGHTS.guestCodCheckout,
    })
  }

  if (
    paymentMethod === 'cash-on-delivery' &&
    typeof order.amount === 'number' &&
    order.amount >= HIGH_COD_AMOUNT_MINOR
  ) {
    flags.push({
      flag: 'high_cod_amount',
      weight: RISK_FLAG_WEIGHTS.highCodAmount,
      detail: `Amount ${order.amount}`,
    })
  }

  if (phone) {
    const sinceIso = new Date(Date.now() - PHONE_VELOCITY_WINDOW_MS).toISOString()
    const recentOrders = await findRecentOrdersByPhone({
      payload,
      phone,
      sinceIso,
      excludeOrderId: order.id,
    })

    if (recentOrders.length + 1 >= PHONE_VELOCITY_THRESHOLD) {
      flags.push({
        flag: 'phone_velocity',
        weight: RISK_FLAG_WEIGHTS.phoneVelocity,
        detail: `${recentOrders.length + 1} orders in 24h`,
      })
    }

    const history = await findOrdersByPhoneHistory({
      payload,
      phone,
      excludeOrderId: order.id,
    })

    const cancelledCount = history.filter((entry) => BAD_STATUSES.has(entry.status ?? '')).length
    if (cancelledCount > 0) {
      flags.push({
        flag: 'prior_cancelled_orders',
        weight: RISK_FLAG_WEIGHTS.priorCancelledOrders,
        detail: `${cancelledCount} prior cancelled/refunded`,
      })
    }

    const deliveredCount = history.filter((entry) => DELIVERED_STATUSES.has(entry.status ?? '')).length
    const processingCount = history.filter((entry) => entry.status === 'processing').length
    if (deliveredCount === 0 && processingCount >= 1) {
      flags.push({
        flag: 'processing_without_delivery',
        weight: RISK_FLAG_WEIGHTS.processingWithoutDelivery,
        detail: `${processingCount} processing without delivery history`,
      })
    }

    if (!customerId && order.appliedPromoCode && history.length === 0) {
      flags.push({
        flag: 'promo_first_guest_order',
        weight: RISK_FLAG_WEIGHTS.promoFirstGuestOrder,
        detail: order.appliedPromoCode,
      })
    }
  }

  const addressKey = normalizeAddressKey(
    order.shippingAddress?.district,
    order.shippingAddress?.fullAddress,
  )

  if (addressKey) {
    const sinceIso = new Date(Date.now() - ADDRESS_CLUSTER_WINDOW_MS).toISOString()
    const recentWithAddress = await payload.find({
      collection: 'orders',
      depth: 0,
      limit: 100,
      overrideAccess: true,
      where: {
        and: [
          { createdAt: { greater_than_equal: sinceIso } },
          { 'shippingAddress.district': { equals: order.shippingAddress.district } },
          { 'shippingAddress.fullAddress': { equals: order.shippingAddress.fullAddress } },
        ],
      },
    })

    const distinctPhones = new Set<string>()
    for (const entry of recentWithAddress.docs) {
      const entryPhone = normalizeRiskPhone(entry.customerPhone)
      if (entryPhone) distinctPhones.add(entryPhone)
    }
    const currentPhone = normalizeRiskPhone(phone)
    if (currentPhone) distinctPhones.add(currentPhone)

    if (distinctPhones.size >= ADDRESS_CLUSTER_PHONE_THRESHOLD) {
      flags.push({
        flag: 'duplicate_address_cluster',
        weight: RISK_FLAG_WEIGHTS.duplicateAddressCluster,
        detail: `${distinctPhones.size} phones at same address`,
      })
    }
  }

  if (isWeakAddress(order.shippingAddress?.fullAddress)) {
    flags.push({
      flag: 'weak_address',
      weight: RISK_FLAG_WEIGHTS.weakAddress,
    })
  }

  if (customerId != null) {
    const customer = await loadCustomerUser(payload, customerId)
    if (customer) {
      const createdAt = customer.createdAt ? new Date(customer.createdAt).getTime() : null
      const isNewAccount = createdAt != null && Date.now() - createdAt <= NEW_ACCOUNT_WINDOW_MS

      if (
        isNewAccount &&
        ((order.appliedLoyaltyPoints ?? 0) > 0 ||
          (order.giftCardDiscountAmount ?? 0) > 0 ||
          Boolean(order.appliedGiftCardCode))
      ) {
        flags.push({
          flag: 'loyalty_new_account',
          weight: RISK_FLAG_WEIGHTS.loyaltyNewAccount,
        })
      }

      if (customer.referredBy && createdAt != null) {
        const orderCreatedAt = order.createdAt ? new Date(order.createdAt).getTime() : Date.now()
        if (orderCreatedAt - createdAt <= REFERRAL_ORDER_WINDOW_MS) {
          flags.push({
            flag: 'referral_quick_order',
            weight: RISK_FLAG_WEIGHTS.referralQuickOrder,
          })
        }
      }
    }
  }

  if (requestContext?.ip) {
    const sinceIso = new Date(Date.now() - PHONE_VELOCITY_WINDOW_MS).toISOString()
    const ipMatches = await payload.find({
      collection: 'orders',
      depth: 0,
      limit: 20,
      overrideAccess: true,
      where: {
        and: [
          { createdAt: { greater_than_equal: sinceIso } },
          { 'riskAssessment.riskCapturedIp': { equals: requestContext.ip } },
          { 'riskAssessment.riskLevel': { equals: 'high' } },
        ],
      },
    })

    if (ipMatches.docs.some((entry) => entry.id !== order.id)) {
      flags.push({
        flag: 'shared_high_risk_ip',
        weight: RISK_FLAG_WEIGHTS.sharedHighRiskIp,
        detail: requestContext.ip,
      })
    }
  }

  return buildRiskScoreResult(flags)
}
