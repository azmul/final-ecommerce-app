import { resolveOrderCartId } from '@/collections/Orders/resolveOrderCartId'
import type { CollectionBeforeChangeHook } from 'payload'
import { APIError } from 'payload'

function resolveRelationId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'object' && value !== null && 'id' in value) {
    const id = (value as { id: unknown }).id
    if (typeof id === 'number' && Number.isFinite(id)) return id
  }
  return null
}

export const assertGiftCardBeforeCreate: CollectionBeforeChangeHook = async ({
  data,
  req,
  operation,
  context,
}) => {
  if (operation !== 'create' || context?.skipGiftCardAssert) {
    return data
  }

  const cartId = await resolveOrderCartId(data as Record<string, unknown>, req)
  if (!cartId) return data

  const cart = await req.payload.findByID({
    id: cartId,
    collection: 'carts',
    depth: 0,
    overrideAccess: true,
    req,
  })

  if (!cart) return data

  const discount =
    typeof cart.giftCardDiscountAmount === 'number' ? cart.giftCardDiscountAmount : 0
  const giftCardId = resolveRelationId(cart.giftCard)

  if (!giftCardId || discount <= 0) return data

  const card = await req.payload.findByID({
    id: giftCardId,
    collection: 'gift-cards',
    depth: 0,
    overrideAccess: true,
    req,
  })

  if (!card) {
    throw new APIError(
      JSON.stringify({
        message: 'Gift card not found or inactive.',
        cause: { code: 'GiftCardInsufficient' },
      }),
      400,
    )
  }

  if (card.active === false) {
    throw new APIError(
      JSON.stringify({
        message: 'Gift card not found or inactive.',
        cause: { code: 'GiftCardInsufficient' },
      }),
      400,
    )
  }

  if (card.expiresAt) {
    const expires = new Date(card.expiresAt)
    if (Number.isFinite(expires.getTime()) && expires.getTime() < Date.now()) {
      throw new APIError(
        JSON.stringify({
          message: 'This gift card has expired.',
          cause: { code: 'GiftCardInsufficient' },
        }),
        400,
      )
    }
  }

  const remaining = typeof card.remainingAmount === 'number' ? card.remainingAmount : 0
  if (remaining < discount) {
    throw new APIError(
      JSON.stringify({
        message: 'Gift card balance is insufficient for this order.',
        cause: { code: 'GiftCardInsufficient' },
      }),
      400,
    )
  }

  return data
}
