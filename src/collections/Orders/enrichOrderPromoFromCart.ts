import { resolveOrderCartId } from '@/collections/Orders/resolveOrderCartId'
import type { CollectionAfterChangeHook } from 'payload'

/**
 * Copies promo snapshot from cart to order and increments promo redemption count.
 */
export const enrichOrderPromoFromCart: CollectionAfterChangeHook = async ({
  doc,
  req,
  operation,
  context,
}) => {
  const record = doc as Record<string, unknown>

  if (operation !== 'create') {
    return doc
  }

  /** Internal updates from this hook should not re-run enrichment. */
  if (context?.skipPromoOrderEnrichment && !context?.checkoutShipmentFollowerOrder) {
    return doc
  }

  const isFollower = context?.checkoutShipmentFollowerOrder === true

  const cartId = await resolveOrderCartId(record, req)
  if (!cartId) {
    return doc
  }

  const cart = await req.payload.findByID({
    id: cartId,
    collection: 'carts',
    depth: 0,
    req,
    overrideAccess: true,
  })

  if (!cart) {
    return doc
  }

  const promoIdRaw = cart.promoCode
  const promoId =
    typeof promoIdRaw === 'object' && promoIdRaw && 'id' in promoIdRaw ?
      promoIdRaw.id
    : promoIdRaw

  const promoDiscount =
    typeof cart.promoDiscountAmount === 'number' ? cart.promoDiscountAmount : null
  const subtotalBefore =
    typeof cart.subtotalBeforeDiscount === 'number' ?
      cart.subtotalBeforeDiscount
    : typeof cart.subtotal === 'number' && promoDiscount !== null ?
      cart.subtotal + promoDiscount
    : null

  await req.payload.update({
    id: doc.id,
    collection: 'orders',
    data: {
      appliedPromoCode: cart.appliedPromoCode ?? null,
      promoCode: promoId ?? null,
      promoDiscountAmount: promoDiscount,
      subtotalBeforeDiscount: subtotalBefore,
      checkoutCart: cartId,
    },
    req,
    overrideAccess: true,
    context: {
      ...context,
      skipPromoOrderEnrichment: true,
    },
  })

  if (!isFollower && typeof promoId === 'number') {
    const promo = await req.payload.findByID({
      id: promoId,
      collection: 'promo-codes',
      depth: 0,
      req,
      overrideAccess: true,
    })
    if (promo) {
      await req.payload.update({
        id: promoId,
        collection: 'promo-codes',
        data: {
          timesRedeemed: (typeof promo.timesRedeemed === 'number' ? promo.timesRedeemed : 0) + 1,
        },
        req,
        overrideAccess: true,
        context: {
          ...context,
          skipPromoOrderEnrichment: true,
        },
      })
    }
  }

  return doc
}
