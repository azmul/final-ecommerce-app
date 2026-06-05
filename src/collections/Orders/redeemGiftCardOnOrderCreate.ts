import { resolveOrderCartId } from '@/collections/Orders/resolveOrderCartId'
import type { Order } from '@/payload-types'
import type { CollectionAfterChangeHook } from 'payload'
import { APIError } from 'payload'

async function resolveGiftCardRedemption(
  order: Order,
  req: Parameters<CollectionAfterChangeHook>[0]['req'],
): Promise<{ discount: number; giftCardId: number | null }> {
  const giftCardFromOrder =
    typeof order.giftCard === 'object' && order.giftCard ?
      order.giftCard.id
    : order.giftCard
  const discountFromOrder =
    typeof order.giftCardDiscountAmount === 'number' ? order.giftCardDiscountAmount : 0

  if (typeof giftCardFromOrder === 'number' && discountFromOrder > 0) {
    return { discount: discountFromOrder, giftCardId: giftCardFromOrder }
  }

  const cartId = await resolveOrderCartId(order as unknown as Record<string, unknown>, req)
  if (!cartId) {
    return { discount: 0, giftCardId: null }
  }

  const cart = await req.payload.findByID({
    id: cartId,
    collection: 'carts',
    depth: 0,
    overrideAccess: true,
    req,
  })

  const giftCardId =
    typeof cart?.giftCard === 'object' && cart.giftCard ?
      cart.giftCard.id
    : cart?.giftCard
  const discount =
    typeof cart?.giftCardDiscountAmount === 'number' ? cart.giftCardDiscountAmount : 0

  return {
    discount: typeof discount === 'number' ? discount : 0,
    giftCardId: typeof giftCardId === 'number' ? giftCardId : null,
  }
}

export const redeemGiftCardOnOrderCreate: CollectionAfterChangeHook = async ({
  doc,
  req,
  operation,
  context,
}) => {
  if (operation !== 'create' || context?.skipGiftCardRedeem) return doc

  const order = doc as Order
  const { discount, giftCardId } = await resolveGiftCardRedemption(order, req)

  if (!giftCardId || discount <= 0) return doc

  const card = await req.payload.findByID({
    id: Number(giftCardId),
    collection: 'gift-cards',
    depth: 0,
    overrideAccess: true,
    req,
  })

  if (!card) return doc

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

  const next = remaining - discount

  await req.payload.update({
    id: card.id,
    collection: 'gift-cards',
    data: {
      active: next > 0,
      remainingAmount: next,
    },
    overrideAccess: true,
    req,
  })

  return doc
}
