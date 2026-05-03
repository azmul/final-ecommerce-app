import type { CollectionSlug } from 'payload'
import type { PaymentAdapter, PaymentAdapterClient } from '@payloadcms/plugin-ecommerce/types'

const paymentMethodName = 'cash-on-delivery'
const paymentMethodFieldName = 'cashOnDelivery'

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
  data,
  req,
}: {
  collection: CollectionSlug
  data: Record<string, unknown>
  req: Parameters<NonNullable<PaymentAdapter['initiatePayment']>>[0]['req']
}) => {
  try {
    return await req.payload.create({
      collection,
      data: data as never,
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
      data: {
        ...data,
        id: nextID,
      } as never,
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
    const { customerFullName, customerPhone } = data as typeof data & {
      customerFullName?: string
      customerPhone?: string
    }

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
          ...(req.user ? { customer: req.user.id } : { customerEmail }),
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
    const transaction = transactionID
      ? ((await req.payload.findByID({
          id: transactionID,
          collection: transactionsSlug as CollectionSlug,
          depth: 0,
          req,
        })) as {
          id: number
          amount?: number | null
          cart?: { id: number } | number | null
          currency?: string | null
          items?: unknown
        })
      : undefined

    const cartID = transaction
      ? typeof transaction.cart === 'object'
        ? transaction.cart?.id
        : transaction.cart
      : data.cartID || data.cart?.id

    if (!cartID) {
      throw new Error('Cart ID not found on transaction.')
    }

    const fallbackFlattenedItems = data.cart?.items?.map(
      (item: NonNullable<typeof data.cart>['items'][number]) => {
        const productID = typeof item.product === 'object' ? item.product.id : item.product
        const variantID = item.variant
          ? typeof item.variant === 'object'
            ? item.variant.id
            : item.variant
          : undefined

        return {
          product: productID,
          quantity: item.quantity,
          ...(variantID ? { variant: variantID } : {}),
        }
      },
    )

    const order = (await createWithUniqueIDRetry({
      collection: ordersSlug as CollectionSlug,
      data: {
        amount: transaction?.amount ?? data.cart?.subtotal ?? 0,
        currency: transaction?.currency ?? data.currency,
        ...(req.user ? { customer: req.user.id } : { customerEmail: data.customerEmail }),
        ...(!req.user && data.customerFullName ? { customerFullName: data.customerFullName } : {}),
        ...(!req.user && data.customerPhone ? { customerPhone: data.customerPhone } : {}),
        items: transaction?.items ?? fallbackFlattenedItems,
        shippingAddress: data.shippingAddress,
        status: 'processing',
        ...(transaction ? { transactions: [transaction.id] } : {}),
      },
      req,
    })) as {
      id: number
      accessToken?: string | null
    }

    await req.payload.update({
      id: cartID,
      collection: cartsSlug as CollectionSlug,
      data: {
        purchasedAt: new Date().toISOString(),
      } as never,
      req,
    })

    if (transaction) {
      await req.payload.update({
        id: transaction.id,
        collection: transactionsSlug as CollectionSlug,
        data: {
          order: order.id,
          status: 'succeeded',
        } as never,
        req,
      })
    }

    return {
      message: 'Order confirmed successfully.',
      orderID: order.id,
      transactionID: transaction?.id ?? order.id,
      ...(order.accessToken ? { accessToken: order.accessToken } : {}),
    }
  },
})
