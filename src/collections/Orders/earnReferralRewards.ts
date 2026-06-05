import { REFERRAL_REWARD_POINTS } from '@/lib/referrals/config'
import { adjustLoyaltyPoints } from '@/lib/loyalty/adjustLoyaltyPoints'
import type { Order, User } from '@/payload-types'
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

export const earnReferralRewards: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
  operation,
  context,
}) => {
  if (context?.skipReferralRewards || operation !== 'update') return doc

  const order = doc as Order
  const prev = previousDoc as Order | undefined
  const status = order.status as string | undefined
  const prevStatus = prev?.status as string | undefined

  if (!status || !EARN_STATUSES.has(status) || status === prevStatus) return doc

  const existingBonus = await req.payload.find({
    collection: 'loyalty-transactions',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    req,
    where: {
      and: [
        { order: { equals: order.id } },
        { description: { contains: 'Referral bonus' } },
      ],
    },
  })
  if (existingBonus.docs.length > 0) return doc

  const customerId = resolveCustomerId(order)
  if (customerId == null) return doc

  const customer = (await req.payload.findByID({
    id: customerId,
    collection: 'users',
    depth: 0,
    overrideAccess: true,
    req,
  })) as User | null

  if (!customer?.referredBy) return doc

  const referrerId =
    typeof customer.referredBy === 'object' && customer.referredBy ?
      customer.referredBy.id
    : customer.referredBy
  if (!referrerId || !Number.isFinite(Number(referrerId))) return doc

  const priorOrders = await req.payload.find({
    collection: 'orders',
    depth: 0,
    limit: 2,
    overrideAccess: true,
    req,
    where: {
      and: [
        { customer: { equals: customerId } },
        { status: { in: ['completed', 'delivered'] } },
      ],
    },
  })

  if (priorOrders.totalDocs > 1) return doc

  await adjustLoyaltyPoints({
    description: `Referral bonus — friend order #${order.id}`,
    orderId: order.id,
    payload: req.payload,
    points: REFERRAL_REWARD_POINTS,
    req,
    type: 'earn',
    userId: Number(referrerId),
  })

  await adjustLoyaltyPoints({
    description: `Welcome referral bonus — order #${order.id}`,
    orderId: order.id,
    payload: req.payload,
    points: REFERRAL_REWARD_POINTS,
    req,
    type: 'earn',
    userId: customerId,
  })

  return doc
}
