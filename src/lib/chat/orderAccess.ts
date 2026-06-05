import type { Payload } from 'payload'

import { parsePositiveInt } from '@/lib/chat/validators'
import type { Order, User } from '@/payload-types'

export async function verifyOrderAccess(args: {
  payload: Payload
  orderId: unknown
  accessToken?: string | null
  user?: User | null
}): Promise<Order | null> {
  const id = parsePositiveInt(args.orderId)
  if (!id) return null

  const token = typeof args.accessToken === 'string' ? args.accessToken.trim() : ''

  if (!args.user && !token) return null

  const result = await args.payload.find({
    collection: 'orders',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: {
      and: [
        { id: { equals: id } },
        ...(args.user
          ? [{ customer: { equals: args.user.id } }]
          : [{ accessToken: { equals: token } }]),
      ],
    },
  })

  return (result.docs[0] as Order | undefined) ?? null
}
