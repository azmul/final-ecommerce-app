import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 60

export async function GET() {
  const payload = await getPayload({ config: configPromise })

  const orders = await payload.find({
    collection: 'orders',
    depth: 2,
    limit: 8,
    overrideAccess: true,
    sort: '-createdAt',
    where: {
      status: { in: ['processing', 'completed', 'shipped', 'delivered'] },
    },
  })

  const items: { city?: string | null; minutesAgo: number; productTitle: string }[] = []

  for (const order of orders.docs) {
    const created = order.createdAt ? new Date(order.createdAt).getTime() : Date.now()
    const minutesAgo = Math.max(1, Math.round((Date.now() - created) / 60_000))

    const district =
      order.shippingAddress && typeof order.shippingAddress === 'object' ?
        (order.shippingAddress as { district?: string }).district
      : null

    const lineItems = Array.isArray(order.items) ? order.items : []
    for (const line of lineItems.slice(0, 1)) {
      const product = line.product
      const title =
        product && typeof product === 'object' && typeof product.title === 'string' ?
          product.title
        : 'an item'

      items.push({
        city: district ?? null,
        minutesAgo,
        productTitle: title,
      })
      break
    }

    if (items.length >= 5) break
  }

  return NextResponse.json({ items })
}
