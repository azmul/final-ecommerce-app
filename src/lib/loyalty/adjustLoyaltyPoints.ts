import type { Payload, PayloadRequest } from 'payload'

import { getLoyaltyBalance } from '@/lib/loyalty/getLoyaltyBalance'

export async function adjustLoyaltyPoints(args: {
  description: string
  orderId?: number
  payload: Payload
  points: number
  req?: PayloadRequest
  type: 'earn' | 'redeem'
  userId: number
}): Promise<number> {
  const redeemPoints = Math.abs(args.points)
  if (!redeemPoints && args.type === 'redeem') {
    return getLoyaltyBalance(args)
  }

  const current = await getLoyaltyBalance(args)

  if (args.type === 'redeem') {
    if (current < redeemPoints) {
      throw new Error('Insufficient loyalty points.')
    }

    const next = current - redeemPoints

    await args.payload.create({
      collection: 'loyalty-transactions',
      data: {
        balanceAfter: next,
        description: args.description,
        order: args.orderId,
        points: redeemPoints,
        type: args.type,
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

    return next
  }

  const earnPoints = Math.abs(args.points)
  if (!earnPoints) return current

  const next = current + earnPoints

  await args.payload.create({
    collection: 'loyalty-transactions',
    data: {
      balanceAfter: next,
      description: args.description,
      order: args.orderId,
      points: earnPoints,
      type: args.type,
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

  return next
}
