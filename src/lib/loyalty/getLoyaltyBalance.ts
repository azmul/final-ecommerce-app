import type { Payload, PayloadRequest } from 'payload'

export async function getLoyaltyBalance(args: {
  payload: Payload
  req?: PayloadRequest
  userId: number
}): Promise<number> {
  const user = await args.payload.findByID({
    id: args.userId,
    collection: 'users',
    depth: 0,
    overrideAccess: true,
    ...(args.req ? { req: args.req } : {}),
    select: { loyaltyPoints: true },
  })

  const balance = user?.loyaltyPoints
  return typeof balance === 'number' && Number.isFinite(balance) ? Math.max(0, Math.floor(balance)) : 0
}
