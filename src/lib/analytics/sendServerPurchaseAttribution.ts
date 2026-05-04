import type { Order, Product, Variant } from '@/payload-types'

import { sendGa4Purchase, type Ga4PurchaseItem } from '@/lib/analytics/sendGa4Purchase'
import { sendMetaPurchase, type MetaPurchaseContent } from '@/lib/analytics/sendMetaPurchase'

function unitPriceFromLineItem(item: NonNullable<Order['items']>[number]): number | undefined {
  const variant = item.variant && typeof item.variant === 'object' ? (item.variant as Variant) : null
  if (variant && typeof variant.priceInBDT === 'number') return variant.priceInBDT

  const product = item.product && typeof item.product === 'object' ? (item.product as Product) : null
  if (product && typeof product.priceInBDT === 'number') return product.priceInBDT

  return undefined
}

function lineItemIds(item: NonNullable<Order['items']>[number]): { id: string; name: string } {
  const product = item.product && typeof item.product === 'object' ? (item.product as Product) : null
  const slug = product?.slug && typeof product.slug === 'string' ? product.slug : null
  const id = slug ?? (product?.id != null ? String(product.id) : 'unknown')
  const name = product?.title && typeof product.title === 'string' ? product.title : id
  return { id, name }
}

export async function sendServerPurchaseAttribution(args: {
  order: Order
  clientId: string
  clientIp?: string | null
  clientUserAgent?: string | null
  fbp?: string | null
  fbc?: string | null
}): Promise<void> {
  const { order, clientId, clientIp, clientUserAgent, fbp, fbc } = args

  const gaMeasurementId = process.env.GA4_MEASUREMENT_ID
  const gaApiSecret = process.env.GA4_API_SECRET
  const metaPixelId = process.env.META_PIXEL_ID
  const metaAccessToken = process.env.META_CAPI_ACCESS_TOKEN

  const transactionId = String(order.id)
  const currency = order.currency || 'BDT'
  const value = typeof order.amount === 'number' ? order.amount : 0
  const eventId = `purchase_${transactionId}`

  const items = order.items ?? []
  const gaItems: Ga4PurchaseItem[] = []
  const metaContents: MetaPurchaseContent[] = []

  for (const line of items) {
    const qty = typeof line.quantity === 'number' ? line.quantity : 1
    const { id, name } = lineItemIds(line)
    const price = unitPriceFromLineItem(line)
    gaItems.push({
      item_id: id,
      item_name: name,
      ...(typeof price === 'number' ? { price } : {}),
      quantity: qty,
    })
    metaContents.push({
      id,
      quantity: qty,
      ...(typeof price === 'number' ? { item_price: price } : {}),
    })
  }

  const tasks: Promise<void>[] = []

  if (gaMeasurementId && gaApiSecret && clientId) {
    tasks.push(
      sendGa4Purchase({
        apiSecret: gaApiSecret,
        clientId,
        currency,
        eventId,
        items: gaItems,
        measurementId: gaMeasurementId,
        transactionId,
        value,
      }),
    )
  }

  if (metaPixelId && metaAccessToken) {
    const email =
      order.customerEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(order.customerEmail.trim()) ?
        order.customerEmail
      : null
    const phone = order.customerPhone ?? null

    tasks.push(
      sendMetaPurchase({
        accessToken: metaAccessToken,
        contents: metaContents,
        currency,
        email,
        eventId,
        eventTimeSeconds: Math.floor(Date.now() / 1000),
        fbc,
        fbp,
        clientIp,
        clientUserAgent,
        orderId: transactionId,
        phone,
        pixelId: metaPixelId,
        value,
      }),
    )
  }

  await Promise.all(tasks)
}
