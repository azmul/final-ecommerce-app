import { orderAmountToEarnedPoints } from '@/lib/loyalty/config'
import { adjustLoyaltyPoints } from '@/lib/loyalty/adjustLoyaltyPoints'
import type { Order } from '@/payload-types'
import type { CollectionAfterChangeHook } from 'payload'

const EARN_STATUSES = new Set(['completed', 'delivered'])

function resolveCustomerId(order: Order): number | null {
  const customer = order.customer
  if (typeof customer === 'number' && Number.isFinite(customer)) return customer
  if (customer && typeof customer === 'object' && 'id' in customer) {
    const id = (customer as { id: unknown }).id
    if (typeof id === 'number' && Number.isFinite(id)) return id
  }
  return null
}

export const earnLoyaltyOnOrderStatus: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
  operation,
  context,
}) => {
  if (context?.skipLoyaltyEarn || operation !== 'update') return doc

  const order = doc as Order
  const prev = previousDoc as Order | undefined
  const status = order.status
  const prevStatus = prev?.status

  if (!status || !EARN_STATUSES.has(status) || status === prevStatus) return doc
  if (typeof order.loyaltyPointsEarned === 'number' && order.loyaltyPointsEarned > 0) return doc

  const userId = resolveCustomerId(order)
  if (userId == null) return doc

  const amount = typeof order.amount === 'number' ? order.amount : 0
  const points = orderAmountToEarnedPoints(amount)
  if (points <= 0) return doc

  const existing = await req.payload.find({
    collection: 'loyalty-transactions',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    req,
    where: {
      and: [
        { order: { equals: order.id } },
        { type: { equals: 'earn' } },
      ],
    },
  })

  if (existing.totalDocs > 0) return doc

  await adjustLoyaltyPoints({
    description: `Earned from order #${order.id}`,
    orderId: order.id,
    payload: req.payload,
    points,
    req,
    type: 'earn',
    userId,
  })

  await req.payload.update({
    id: order.id,
    collection: 'orders',
    data: { loyaltyPointsEarned: points },
    overrideAccess: true,
    req,
    context: { ...context, skipLoyaltyEarn: true },
  })

  return doc
}
