import type { Order } from '@/payload-types'
import type { Payload, PayloadRequest } from 'payload'

import { getLoyaltyBalance } from '@/lib/loyalty/getLoyaltyBalance'

export async function clawbackLoyaltyForOrder(args: {
  order: Order
  payload: Payload
  req?: PayloadRequest
  userId: number
}): Promise<void> {
  const earned =
    typeof args.order.loyaltyPointsEarned === 'number' ? args.order.loyaltyPointsEarned : 0
  if (earned <= 0) return

  const existing = await args.payload.find({
    collection: 'loyalty-transactions',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    ...(args.req ? { req: args.req } : {}),
    where: {
      and: [
        { order: { equals: args.order.id } },
        { description: { contains: 'Clawback' } },
      ],
    },
  })

  if (existing.totalDocs > 0) return

  const current = await getLoyaltyBalance(args)
  const claw = Math.min(earned, current)
  if (claw <= 0) return

  const next = current - claw

  await args.payload.create({
    collection: 'loyalty-transactions',
    data: {
      balanceAfter: next,
      description: `Clawback from order #${args.order.id} refund`,
      order: args.order.id,
      points: claw,
      type: 'redeem',
      user: args.userId,
    },
    overrideAccess: true,
    ...(args.req ? { req: args.req } : {}),
  })

  await args.payload.update({
    id: args.userId,
    collection: 'users',
    data: { loyaltyPoints: next },
    overrideAccess: true,
    ...(args.req ? { req: args.req } : {}),
  })

  await args.payload.update({
    id: args.order.id,
    collection: 'orders',
    data: { loyaltyPointsEarned: 0 },
    overrideAccess: true,
    ...(args.req ? { req: args.req } : {}),
    context: { skipLoyaltyEarn: true },
  })
}
