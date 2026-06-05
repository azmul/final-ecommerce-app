import type { Order } from '@/payload-types'
import type { Payload, PayloadRequest } from 'payload'

function resolveRelationId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'object' && value !== null && 'id' in value) {
    const id = (value as { id: unknown }).id
    if (typeof id === 'number' && Number.isFinite(id)) return id
  }
  return null
}

export async function restoreGiftCardForOrder(args: {
  order: Order
  payload: Payload
  req?: PayloadRequest
}): Promise<void> {
  const giftCardId = resolveRelationId(args.order.giftCard)
  const discount =
    typeof args.order.giftCardDiscountAmount === 'number' ?
      args.order.giftCardDiscountAmount
    : 0

  if (!giftCardId || discount <= 0) return

  const card = await args.payload.findByID({
    id: giftCardId,
    collection: 'gift-cards',
    depth: 0,
    overrideAccess: true,
    ...(args.req ? { req: args.req } : {}),
  })

  if (!card) return

  const remaining = typeof card.remainingAmount === 'number' ? card.remainingAmount : 0
  const next = remaining + discount

  await args.payload.update({
    id: card.id,
    collection: 'gift-cards',
    data: {
      active: true,
      remainingAmount: next,
    },
    overrideAccess: true,
    ...(args.req ? { req: args.req } : {}),
  })
}
