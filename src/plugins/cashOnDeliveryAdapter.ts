import type { PaymentAdapter, PaymentAdapterClient } from '@payloadcms/plugin-ecommerce/types'
import type { CollectionSlug } from 'payload'

import { APIError } from 'payload'

import {
  inventoryErrorPayload,
  validateCartInventory,
} from '@/lib/inventory/validateCartInventory'
import { ALREADY_CHECKED_OUT_MESSAGE } from '@/lib/payments/checkoutErrors'
import {
  buildCheckoutShippingQuote,
  flattenOrderItemsFromGroup,
} from '@/lib/shipping/cartShipmentQuote'
import {
  districtToDeliveryArea,
  type CustomerDeliveryPrefs,
} from '@/lib/shipping/customerDeliveryPrefs'
import { loadCartForShipmentQuote } from '@/lib/shipping/loadCartForShipmentQuote'
import type { Cart } from '@/payload-types'
import { resolveGuestPhoneFromCheckoutContact } from '@/utilities/contactToLoginEmail'

const paymentMethodName = 'cash-on-delivery'
const normalizePhoneDigits = (value: string): string => value.replace(/\D/g, '')
const paymentMethodFieldName = 'cashOnDelivery'

const resolveRelationId = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'object' && value !== null && 'id' in value) {
    const id = (value as { id: unknown }).id
    if (typeof id === 'number' && Number.isFinite(id)) return id
  }
  return null
}

const assertTransactionAuthorized = ({
  authorizedCartID,
  customerEmail,
  customerPhone,
  req,
  transaction,
}: {
  authorizedCartID?: number
  customerEmail?: string
  customerPhone?: string
  req: Parameters<NonNullable<PaymentAdapter['confirmOrder']>>[0]['req']
  transaction: {
    cart?: unknown
    customer?: unknown
    customerEmail?: string | null
    customerPhone?: string | null
  }
}): number => {
  const transactionCartID = resolveRelationId(transaction.cart)
  if (!transactionCartID) {
    throw new Error('Transaction is not linked to a cart.')
  }

  if (authorizedCartID != null && transactionCartID !== authorizedCartID) {
    throw new Error('Transaction does not match the checkout cart.')
  }

  if (req.user) {
    const transactionCustomer = resolveRelationId(transaction.customer)
    if (transactionCustomer != null && transactionCustomer !== req.user.id) {
      throw new Error('You are not authorized to use this transaction.')
    }
    if (transactionCustomer == null && transaction.customerEmail) {
      throw new Error('You are not authorized to use this transaction.')
    }
  } else {
    const phone = typeof customerPhone === 'string' ? customerPhone.trim() : ''
    const txPhone =
      typeof transaction.customerPhone === 'string' ? transaction.customerPhone.trim() : ''
    if (
      phone &&
      txPhone &&
      normalizePhoneDigits(phone) === normalizePhoneDigits(txPhone)
    ) {
      return transactionCartID
    }

    const email = typeof customerEmail === 'string' ? customerEmail.trim() : ''
    const txEmail =
      typeof transaction.customerEmail === 'string' ? transaction.customerEmail.trim() : ''
    if (email && txEmail && email === txEmail) {
      return transactionCartID
    }

    throw new Error('You are not authorized to use this transaction.')
  }

  return transactionCartID
}

const hasUniqueIDValidationError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return false
  const data = 'data' in error ? (error as { data?: unknown }).data : undefined
  if (!data || typeof data !== 'object') return false
  const errors = 'errors' in data ? (data as { errors?: unknown }).errors : undefined
  if (!Array.isArray(errors)) return false

  return errors.some((item) => {
    if (!item || typeof item !== 'object') return false
    const path = 'path' in item ? (item as { path?: unknown }).path : undefined
    const message = 'message' in item ? (item as { message?: unknown }).message : undefined
    return path === 'id' && message === 'Value must be unique'
  })
}

const createWithUniqueIDRetry = async ({
  collection,
  context,
  data,
  req,
}: {
  collection: CollectionSlug
  context?: Record<string, unknown>
  data: Record<string, unknown>
  req: Parameters<NonNullable<PaymentAdapter['initiatePayment']>>[0]['req']
}) => {
  try {
    return await req.payload.create({
      collection,
      context,
      data: data as never,
      overrideAccess: true,
      req,
    })
  } catch (error) {
    if (!hasUniqueIDValidationError(error)) {
      throw error
    }

    const latest = await req.payload.find({
      collection,
      depth: 0,
      limit: 1,
      sort: '-id',
      req,
    })

    const latestID = latest.docs?.[0] && 'id' in latest.docs[0] ? Number(latest.docs[0].id) : 0
    const nextID = Number.isFinite(latestID) ? latestID + 1 : 1

    return await req.payload.create({
      collection,
      context,
      data: {
        ...data,
        id: nextID,
      } as never,
      overrideAccess: true,
      req,
    })
  }
}

export const cashOnDeliveryAdapterClient = (): PaymentAdapterClient => ({
  name: paymentMethodName,
  label: 'Cash on delivery',
  confirmOrder: true,
  initiatePayment: true,
})

export const cashOnDeliveryAdapter = (): PaymentAdapter => ({
  name: paymentMethodName,
  label: 'Cash on delivery',
  group: {
    name: paymentMethodFieldName,
    type: 'group',
    admin: {
      condition: (data) => data?.paymentMethod === paymentMethodName,
    },
    fields: [
      {
        name: 'note',
        type: 'text',
        admin: {
          readOnly: true,
        },
        defaultValue: 'Payment will be collected on delivery.',
        label: 'Note',
      },
    ],
  },
  initiatePayment: async ({ data, req, transactionsSlug }) => {
    const { billingAddress, cart, currency, customerEmail } = data
    const { customerFullName, customerPhone: customerPhoneRaw } = data as typeof data & {
      customerFullName?: string
      customerPhone?: string
    }
    const customerPhone = resolveGuestPhoneFromCheckoutContact({
      customerEmail: typeof customerEmail === 'string' ? customerEmail : undefined,
      customerPhone: customerPhoneRaw,
    })

    if (!cart || !cart.items || cart.items.length === 0) {
      throw new Error('Cart is empty or not provided.')
    }

    const flattenedCart = cart.items.map((item) => {
      const productID = typeof item.product === 'object' ? item.product.id : item.product
      const variantID = item.variant
        ? typeof item.variant === 'object'
          ? item.variant.id
          : item.variant
        : undefined

      const { product: _product, variant: _variant, ...customProperties } = item

      return {
        ...customProperties,
        product: productID,
        quantity: item.quantity,
        ...(variantID ? { variant: variantID } : {}),
      }
    })

    let transactionID: number | undefined
    try {
      const transaction = await createWithUniqueIDRetry({
        collection: transactionsSlug as CollectionSlug,
        data: {
          ...(req.user ? { customer: req.user.id } : {}),
          ...(!req.user && customerEmail ? { customerEmail } : {}),
          ...(!req.user && customerFullName ? { customerFullName } : {}),
          ...(!req.user && customerPhone ? { customerPhone } : {}),
          amount: cart.subtotal,
          billingAddress,
          cart: cart.id,
          currency,
          items: flattenedCart,
          paymentMethod: paymentMethodName,
          status: 'pending',
          [paymentMethodFieldName]: {
            note: 'Payment will be collected on delivery.',
          },
        },
        req,
      })
      transactionID = Number(transaction.id)
    } catch {
      // Transaction creation is optional for COD fallback flow.
      transactionID = undefined
    }

    return {
      message: 'Cash on delivery order is ready to confirm.',
      cartID: cart.id,
      ...(transactionID ? { transactionID } : {}),
    }
  },
  confirmOrder: async ({
    cartsSlug = 'carts',
    data,
    ordersSlug = 'orders',
    req,
    transactionsSlug = 'transactions',
  }) => {
    const transactionID = data.transactionID ? Number(data.transactionID) : undefined
    const transaction = await (async () => {
      if (!transactionID) return undefined
      try {
        return (await req.payload.findByID({
          id: transactionID,
          collection: transactionsSlug as CollectionSlug,
          depth: 0,
          overrideAccess: true,
          req,
        })) as {
          id: number
          amount?: number | null
          cart?: { id: number } | number | null
          currency?: string | null
          customer?: { id: number } | number | null
          customerEmail?: string | null
          customerPhone?: string | null
          items?: unknown
        }
      } catch {
        // Guests / customers may not be able to read transactions; treat as optional.
        return undefined
      }
    })()

    const authorizedCartIDRaw = data.cartID ?? data.cart?.id
    const authorizedCartID =
      authorizedCartIDRaw != null && Number.isFinite(Number(authorizedCartIDRaw)) ?
        Number(authorizedCartIDRaw)
      : undefined

    const customerEmail =
      typeof data.customerEmail === 'string' ? data.customerEmail : undefined
    const customerPhone = resolveGuestPhoneFromCheckoutContact({
      customerEmail,
      customerPhone:
        typeof data.customerPhone === 'string' ? data.customerPhone : undefined,
    })

    const cartID = transaction
      ? assertTransactionAuthorized({
          authorizedCartID,
          customerEmail,
          customerPhone,
          req,
          transaction,
        })
      : authorizedCartID

    if (!cartID) {
      throw new Error('Cart ID not found on transaction.')
    }

    const shippingAddress = data.shippingAddress as Record<string, unknown> | undefined
    if (
      !shippingAddress ||
      typeof shippingAddress !== 'object' ||
      typeof shippingAddress.district !== 'string'
    ) {
      throw new Error('Shipping address with district is required to confirm shipment pricing.')
    }

    const district = shippingAddress.district
    const deliveryType: CustomerDeliveryPrefs['deliveryType'] =
      data.deliveryType === 'point' ? 'point' : 'home'

    const prefs: CustomerDeliveryPrefs = {
      area: districtToDeliveryArea(district),
      deliveryType,
    }

    const fullCart = await loadCartForShipmentQuote(req.payload, Number(cartID))
    if (!fullCart) {
      throw new Error('Unable to load cart for checkout.')
    }

    if (fullCart.purchasedAt) {
      throw new APIError(ALREADY_CHECKED_OUT_MESSAGE, 409)
    }

    const inventoryCheck = await validateCartInventory({
      district,
      payload: req.payload,
      req,
      items: fullCart.items,
    })
    if (!inventoryCheck.ok) {
      throw new APIError(inventoryErrorPayload(inventoryCheck), 400)
    }

    const currency =
      typeof fullCart.currency === 'string' && fullCart.currency ? fullCart.currency : 'BDT'

    const quote = await buildCheckoutShippingQuote({
      cart: fullCart as Cart,
      currency,
      prefs,
      payload: req.payload,
    })

    if (!quote.ok) {
      throw new Error(quote.message)
    }

    const checkoutBatchId = crypto.randomUUID()
    type CreatedOrder = { id: number; accessToken?: string | null }
    const orders: CreatedOrder[] = []

    const customerBlock = req.user ? { customer: req.user.id } : {}
    const guestContact = !req.user
      ? {
          ...(typeof data.customerFullName === 'string'
            ? { customerFullName: data.customerFullName }
            : {}),
          ...(typeof data.customerPhone === 'string' ? { customerPhone: data.customerPhone } : {}),
        }
      : {}

    for (let index = 0; index < quote.shipmentGroups.length; index++) {
      const g = quote.shipmentGroups[index]
      const flattenedItems = flattenOrderItemsFromGroup(g.cartLines)
      const follower = index > 0

      const checkoutShipmentSummary = {
        checkoutBatchId,
        districtSnapshot: district,
        ordersInCheckout: quote.shipmentGroups.length,
        orderIndex: index + 1,
        deliveryPrefs: prefs,
        shipmentGroup: {
          shipmentId: g.shipmentId,
          shipmentName: g.shipmentName,
          totalQuantity: g.totalQuantity,
          shippingTotalBdt: g.shippingTotalBdt,
          baseChargeBdt: g.baseChargeBdt,
          cumulativeChargeBdt: g.cumulativeChargeBdt,
          chargeLines: g.chargeLines,
          allocatedMerchandiseSubtotalBdt: g.allocatedMerchandiseSubtotalBdt,
          orderTotalBdt: g.orderTotalBdt,
        },
      }

      const order = (await createWithUniqueIDRetry({
        collection: ordersSlug as CollectionSlug,
        context: follower ? { checkoutShipmentFollowerOrder: true } : undefined,
        data: {
          amount: g.orderTotalBdt,
          checkoutBatchId,
          checkoutCart: cartID,
          checkoutShipmentSummary,
          currency: transaction?.currency ?? data.currency,
          ...customerBlock,
          ...guestContact,
          items: flattenedItems,
          shippingAddress: data.shippingAddress,
          status: 'processing',
          ...(transaction && !follower ? { transactions: [transaction.id] } : {}),
        },
        req,
      })) as CreatedOrder

      orders.push(order)
    }

    if (orders.length === 0) {
      throw new Error('No orders were created.')
    }

    const primaryOrder = orders[0]
    const relatedIds = orders.slice(1).map((o) => o.id)

    await req.payload.update({
      id: Number(cartID),
      collection: cartsSlug as CollectionSlug,
      context: {
        skipInventoryCartValidation: true,
      },
      data: {
        purchasedAt: new Date().toISOString(),
      } as never,
      overrideAccess: true,
      req,
    })

    if (transaction) {
      await req.payload.update({
        id: transaction.id,
        collection: transactionsSlug as CollectionSlug,
        data: {
          amount: quote.grandTotalBdt,
          order: primaryOrder.id,
          status: 'succeeded',
        } as never,
        overrideAccess: true,
        req,
      })
    }

    return {
      accessToken:
        typeof primaryOrder.accessToken === 'string' && primaryOrder.accessToken
          ? primaryOrder.accessToken
          : undefined,
      message: 'Order confirmed successfully.',
      orderID: primaryOrder.id,
      ...(relatedIds.length ? { relatedOrderIDs: relatedIds } : {}),
      transactionID: transaction?.id ?? 0,
    }
  },
})
