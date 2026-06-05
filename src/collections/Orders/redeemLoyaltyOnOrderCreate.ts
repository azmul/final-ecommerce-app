import { resolveOrderCartId } from '@/collections/Orders/resolveOrderCartId'
import { adjustLoyaltyPoints } from '@/lib/loyalty/adjustLoyaltyPoints'
import type { Order } from '@/payload-types'
import type { CollectionAfterChangeHook } from 'payload'

function resolveCustomerId(order: Order): number | null {
  const customer = order.customer
  if (typeof customer === 'number' && Number.isFinite(customer)) return customer
  if (customer && typeof customer === 'object' && 'id' in customer) {
    const id = (customer as { id: unknown }).id
    if (typeof id === 'number' && Number.isFinite(id)) return id
  }
  return null
}

async function resolveCartPoints(
  order: Order,
  req: Parameters<CollectionAfterChangeHook>[0]['req'],
): Promise<number> {
  const fromOrder =
    typeof order.appliedLoyaltyPoints === 'number' ? order.appliedLoyaltyPoints : 0
  if (fromOrder > 0) return fromOrder

  const cartId = await resolveOrderCartId(order as unknown as Record<string, unknown>, req)
  if (!cartId) return 0

  const cart = await req.payload.findByID({
    id: cartId,
    collection: 'carts',
    depth: 0,
    overrideAccess: true,
    req,
  })

  return typeof cart?.appliedLoyaltyPoints === 'number' ? cart.appliedLoyaltyPoints : 0
}

export const redeemLoyaltyOnOrderCreate: CollectionAfterChangeHook = async ({
  doc,
  req,
  operation,
  context,
}) => {
  if (operation !== 'create' || context?.skipLoyaltyRedeem) return doc

  const order = doc as Order
  const points = await resolveCartPoints(order, req)
  if (points <= 0) return doc

  const userId = resolveCustomerId(order)
  if (userId == null) return doc

  const existing = await req.payload.find({
    collection: 'loyalty-transactions',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    req,
    where: {
      and: [
        { order: { equals: order.id } },
        { type: { equals: 'redeem' } },
      ],
    },
  })

  if (existing.totalDocs > 0) return doc

  await adjustLoyaltyPoints({
    description: `Redeemed on order #${order.id}`,
    orderId: order.id,
    payload: req.payload,
    points,
    req,
    type: 'redeem',
    userId,
  })

  return doc
}
