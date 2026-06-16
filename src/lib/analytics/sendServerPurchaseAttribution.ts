import type { Order, Product, Variant } from '@/payload-types'

import { sendGa4Purchase, type Ga4PurchaseItem } from '@/lib/analytics/sendGa4Purchase'
import { sendMetaPurchase, type MetaPurchaseContent } from '@/lib/analytics/sendMetaPurchase'
import { resolveProductCategory } from '@/lib/analytics/meta/productContent'

function unitPriceFromLineItem(item: NonNullable<Order['items']>[number]): number | undefined {
  const variant = item.variant && typeof item.variant === 'object' ? (item.variant as Variant) : null
  if (variant && typeof variant.priceInBDT === 'number') return variant.priceInBDT

  const product = item.product && typeof item.product === 'object' ? (item.product as Product) : null
  if (product && typeof product.priceInBDT === 'number') return product.priceInBDT

  return undefined
}

function lineItemIds(item: NonNullable<Order['items']>[number]): {
  id: string
  name: string
  category?: string
} {
  const product = item.product && typeof item.product === 'object' ? (item.product as Product) : null
  const slug = product?.slug && typeof product.slug === 'string' ? product.slug : null
  const id = slug ?? (product?.id != null ? String(product.id) : 'unknown')
  const name = product?.title && typeof product.title === 'string' ? product.title : id
  const category = resolveProductCategory(product?.categories)
  return { category, id, name }
}

export async function sendServerPurchaseAttribution(args: {
  order: Order
  clientId: string
  clientIp?: string | null
  clientUserAgent?: string | null
  fbp?: string | null
  fbc?: string | null
  eventId?: string
  eventSourceUrl?: string | null
}): Promise<void> {
  const { order, clientId, clientIp, clientUserAgent, fbp, fbc, eventId, eventSourceUrl } = args

  const gaMeasurementId = process.env.GA4_MEASUREMENT_ID
  const gaApiSecret = process.env.GA4_API_SECRET

  const transactionId = String(order.id)
  const currency = order.currency || 'BDT'
  const value = typeof order.amount === 'number' ? order.amount : 0
  const purchaseEventId = eventId ?? `purchase_${transactionId}`

  const items = order.items ?? []
  const gaItems: Ga4PurchaseItem[] = []
  const metaContents: MetaPurchaseContent[] = []

  for (const line of items) {
    const qty = typeof line.quantity === 'number' ? line.quantity : 1
    const { category, id, name } = lineItemIds(line)
    const price = unitPriceFromLineItem(line)
    gaItems.push({
      item_id: id,
      item_name: name,
      ...(typeof price === 'number' ? { price } : {}),
      quantity: qty,
    })
    metaContents.push({
      category,
      id,
      item_price: typeof price === 'number' ? price : undefined,
      quantity: qty,
      title: name,
    })
  }

  const tasks: Promise<void>[] = []

  if (gaMeasurementId && gaApiSecret && clientId) {
    tasks.push(
      sendGa4Purchase({
        apiSecret: gaApiSecret,
        clientId,
        currency,
        eventId: purchaseEventId,
        items: gaItems,
        measurementId: gaMeasurementId,
        transactionId,
        value,
      }),
    )
  }

  const email =
    order.customerEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(order.customerEmail.trim()) ?
      order.customerEmail
    : null
  const phone = order.customerPhone ?? null

  tasks.push(
    sendMetaPurchase({
      clientIp,
      clientUserAgent,
      contents: metaContents,
      currency,
      email,
      eventId: purchaseEventId,
      eventSourceUrl,
      eventTimeSeconds: Math.floor(Date.now() / 1000),
      externalId: clientId,
      fbc,
      fbp,
      orderId: transactionId,
      phone,
      value,
    }),
  )

  await Promise.all(tasks)
}
