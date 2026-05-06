import type { Payload } from 'payload'

import { computeDiscountAmount, filterEligibleLines } from '@/lib/promoCodes/computeDiscountAmount'
import { normalizePromoCode } from '@/lib/promoCodes/normalizeCode'
import { promoMajorUnitsToMinor } from '@/lib/promoCodes/promoMoney'
import type { CartLineForPromo, PromoValidationError } from '@/lib/promoCodes/types'
import { promoErrorMessages } from '@/lib/promoCodes/types'

type PromoDoc = {
  id: number
  code: string
  active?: boolean | null
  validFrom?: string | null
  validUntil?: string | null
  discountType: 'percentage' | 'fixed'
  discountPercentage?: number | null
  discountFixedAmount?: number | null
  maxDiscountAmount?: number | null
  minOrderSubtotal?: number | null
  restrictToProducts?: (number | { id: number })[] | null
  excludeProducts?: (number | { id: number })[] | null
  excludeCategories?: (number | { id: number })[] | null
  maxRedemptionsTotal?: number | null
  maxRedemptionsPerUser?: number | null
  firstTimeCustomersOnly?: boolean | null
  allowedEmailDomains?: string | null
  timesRedeemed?: number | null
}

function toIdList(value: PromoDoc['restrictToProducts']): number[] {
  if (!value?.length) return []
  return value
    .map((v) => (typeof v === 'object' && v?.id ? v.id : typeof v === 'number' ? v : null))
    .filter((id): id is number => id !== null)
}

function parseEmailDomains(text: string | null | undefined): string[] {
  if (!text?.trim()) return []
  return text
    .split(/[\n,]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
}

function extractEmailDomain(email: string): string | null {
  const at = email.indexOf('@')
  if (at === -1) return null
  return email.slice(at + 1).toLowerCase()
}

export type ValidatePromoResult =
  | {
      ok: true
      promoId: number
      normalizedCode: string
      discountAmount: number
    }
  | {
      ok: false
      error: PromoValidationError
      message: string
    }

export async function validatePromoForCart(args: {
  payload: Payload
  req: Parameters<Payload['find']>[0]['req']
  codeInput: string
  rawCartSubtotal: number
  lines: CartLineForPromo[]
  now?: Date
  userId?: number | null
  userEmail?: string | null
}): Promise<ValidatePromoResult> {
  const {
    payload,
    req,
    codeInput,
    rawCartSubtotal,
    lines,
    now = new Date(),
    userId,
    userEmail,
  } = args
  const normalized = normalizePromoCode(codeInput)
  if (!normalized) {
    return { ok: false, error: 'invalid_code', message: promoErrorMessages.invalid_code }
  }

  const found = await payload.find({
    collection: 'promo-codes',
    where: { code: { equals: normalized } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
    req,
  })

  const promo = found.docs[0] as PromoDoc | undefined
  if (!promo) {
    return { ok: false, error: 'invalid_code', message: promoErrorMessages.invalid_code }
  }

  if (promo.active === false) {
    return { ok: false, error: 'inactive', message: promoErrorMessages.inactive }
  }

  if (promo.validFrom) {
    const start = new Date(promo.validFrom)
    if (now < start) {
      return { ok: false, error: 'not_started', message: promoErrorMessages.not_started }
    }
  }

  if (promo.validUntil) {
    const end = new Date(promo.validUntil)
    if (now > end) {
      return { ok: false, error: 'expired', message: promoErrorMessages.expired }
    }
  }

  const maxTotal = promo.maxRedemptionsTotal
  if (typeof maxTotal === 'number' && maxTotal > 0) {
    const redeemed = promo.timesRedeemed ?? 0
    if (redeemed >= maxTotal) {
      return { ok: false, error: 'usage_limit', message: promoErrorMessages.usage_limit }
    }
  }

  if (
    userId &&
    typeof promo.maxRedemptionsPerUser === 'number' &&
    promo.maxRedemptionsPerUser > 0
  ) {
    const userOrders = await payload.count({
      collection: 'orders',
      where: {
        and: [
          { promoCode: { equals: promo.id } },
          { customer: { equals: userId } },
          { status: { not_equals: 'cancelled' } },
        ],
      },
      req,
      overrideAccess: true,
    })
    if (userOrders.totalDocs >= promo.maxRedemptionsPerUser) {
      return { ok: false, error: 'per_user_limit', message: promoErrorMessages.per_user_limit }
    }
  }

  if (promo.firstTimeCustomersOnly && userId) {
    const prior = await payload.count({
      collection: 'orders',
      where: {
        and: [{ customer: { equals: userId } }, { status: { not_equals: 'cancelled' } }],
      },
      req,
      overrideAccess: true,
    })
    if (prior.totalDocs > 0) {
      return { ok: false, error: 'first_time_only', message: promoErrorMessages.first_time_only }
    }
  }

  const domains = parseEmailDomains(promo.allowedEmailDomains)
  if (domains.length > 0 && userEmail) {
    const domain = extractEmailDomain(userEmail)
    if (!domain || !domains.includes(domain)) {
      return { ok: false, error: 'email_domain', message: promoErrorMessages.email_domain }
    }
  }

  const minOrder = promo.minOrderSubtotal
  if (typeof minOrder === 'number' && minOrder > 0) {
    const minOrderMinor = promoMajorUnitsToMinor(minOrder)
    if (rawCartSubtotal < minOrderMinor) {
      return { ok: false, error: 'min_order', message: promoErrorMessages.min_order }
    }
  }

  const eligibleLines = filterEligibleLines(lines, {
    restrictToProductIds: toIdList(promo.restrictToProducts),
    excludeProductIds: toIdList(promo.excludeProducts),
    excludeCategoryIds: toIdList(promo.excludeCategories),
  })

  const discountAmount = computeDiscountAmount({
    rawCartSubtotal,
    eligibleLines,
    rule: {
      discountType: promo.discountType,
      discountPercentage: promo.discountPercentage,
      discountFixedAmount: promo.discountFixedAmount,
      maxDiscountAmount: promo.maxDiscountAmount,
    },
  })

  if (discountAmount <= 0) {
    return {
      ok: false,
      error: 'no_eligible_items',
      message: promoErrorMessages.no_eligible_items,
    }
  }

  return {
    ok: true,
    promoId: promo.id,
    normalizedCode: normalized,
    discountAmount,
  }
}

export async function buildCartLinesFromItems(args: {
  payload: Payload
  req: Parameters<Payload['find']>[0]['req']
  items: NonNullable<{ product?: unknown; variant?: unknown; quantity?: unknown }>[]
  currency: string
  productsSlug?: string
  variantsSlug?: string
}): Promise<CartLineForPromo[]> {
  const {
    payload,
    req,
    items,
    currency,
    productsSlug = 'products',
    variantsSlug = 'variants',
  } = args
  const priceField = `priceIn${currency}` as 'priceInBDT'
  const lines: CartLineForPromo[] = []

  for (const item of items) {
    const qty = typeof item.quantity === 'number' ? item.quantity : 0
    if (qty <= 0) continue

    let productId: number | undefined
    let lineSubtotal = 0
    let categoryIds: number[] = []

    if (item.variant) {
      const variantId =
        typeof item.variant === 'object' && item.variant && 'id' in item.variant ?
          (item.variant as { id: number }).id
        : (item.variant as number)

      const variant = await payload.findByID({
        id: variantId,
        collection: variantsSlug as Parameters<Payload['findByID']>[0]['collection'],
        depth: 0,
        req,
        overrideAccess: true,
        select: {
          [priceField]: true,
        },
      })
      const unit =
        variant && typeof variant === 'object' && priceField in variant ?
          (variant as Record<string, number | undefined>)[priceField]
        : undefined
      if (typeof unit !== 'number' || !Number.isFinite(unit)) continue

      const productRef = item.product
      productId =
        typeof productRef === 'object' && productRef && 'id' in productRef ?
          (productRef as { id: number }).id
        : (productRef as number)

      lineSubtotal = unit * qty
    } else if (item.product) {
      const id =
        typeof item.product === 'object' && item.product && 'id' in item.product ?
          (item.product as { id: number }).id
        : (item.product as number)
      productId = id

      const product = await payload.findByID({
        id,
        collection: productsSlug as Parameters<Payload['findByID']>[0]['collection'],
        depth: 0,
        req,
        overrideAccess: true,
        select: {
          [priceField]: true,
          categories: true,
        },
      })

      const unit =
        product && typeof product === 'object' && priceField in product ?
          (product as Record<string, number | undefined>)[priceField]
        : undefined
      if (typeof unit !== 'number' || !Number.isFinite(unit)) continue

      lineSubtotal = unit * qty

      const cats = (product as { categories?: unknown }).categories
      if (Array.isArray(cats)) {
        categoryIds = cats
          .map((c) => (typeof c === 'object' && c && 'id' in c ? (c as { id: number }).id : c))
          .filter((c): c is number => typeof c === 'number')
      }
    }

    if (productId === undefined || lineSubtotal <= 0) continue

    if (item.variant) {
      const product = await payload.findByID({
        id: productId,
        collection: productsSlug as Parameters<Payload['findByID']>[0]['collection'],
        depth: 0,
        req,
        overrideAccess: true,
        select: { categories: true },
      })
      const cats =
        product && typeof product === 'object' ? (product as { categories?: unknown }).categories : undefined
      if (Array.isArray(cats)) {
        categoryIds = cats
          .map((c) => (typeof c === 'object' && c && 'id' in c ? (c as { id: number }).id : c))
          .filter((c): c is number => typeof c === 'number')
      }
    }

    lines.push({ productId, lineSubtotal, categoryIds })
  }

  return lines
}
