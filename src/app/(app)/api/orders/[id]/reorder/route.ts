import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params
  const orderId = Number(id)
  if (!Number.isFinite(orderId)) {
    return NextResponse.json({ error: 'Invalid order id.' }, { status: 400 })
  }

  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }

  const order = await payload.findByID({
    id: orderId,
    collection: 'orders',
    depth: 2,
    overrideAccess: false,
    user,
  })

  if (!order) {
    return NextResponse.json({ error: 'Order not found.' }, { status: 404 })
  }

  const owner =
    typeof order.customer === 'object' && order.customer ? order.customer.id : order.customer
  if (owner !== user.id) {
    return NextResponse.json({ error: 'Order not found.' }, { status: 404 })
  }

  const items = Array.isArray(order.items) ? order.items : []
  if (!items.length) {
    return NextResponse.json({ error: 'This order has no items to reorder.' }, { status: 400 })
  }

  let cart = (
    await payload.find({
      collection: 'carts',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      where: {
        and: [
          { customer: { equals: user.id } },
          { purchasedAt: { exists: false } },
        ],
      },
    })
  ).docs[0]

  if (!cart) {
    cart = await payload.create({
      collection: 'carts',
      data: {
        customer: user.id,
        items: [],
      },
      overrideAccess: true,
    })
  }

  const existingItems = Array.isArray(cart.items) ? [...cart.items] : []
  let added = 0
  let skipped = 0

  for (const line of items) {
    const product =
      line && typeof line === 'object' && 'product' in line ? line.product : null
    const variant =
      line && typeof line === 'object' && 'variant' in line ? line.variant : null
    const quantity =
      line && typeof line === 'object' && typeof line.quantity === 'number' ? line.quantity : 1

    const productId =
      typeof product === 'object' && product && 'id' in product ?
        product.id
      : typeof product === 'number' ? product
      : null
    const variantId =
      typeof variant === 'object' && variant && 'id' in variant ?
        variant.id
      : typeof variant === 'number' ? variant
      : null

    if (!productId) {
      skipped += 1
      continue
    }

    const published = await payload.findByID({
      id: productId,
      collection: 'products',
      depth: 0,
      overrideAccess: true,
    })

    if (!published || published._status !== 'published') {
      skipped += 1
      continue
    }

    existingItems.push({
      product: productId,
      quantity: Math.max(1, quantity),
      ...(variantId ? { variant: variantId } : {}),
    })
    added += 1
  }

  await payload.update({
    id: cart.id,
    collection: 'carts',
    data: { items: existingItems },
    overrideAccess: true,
  })

  return NextResponse.json({ added, cartId: cart.id, skipped })
}
