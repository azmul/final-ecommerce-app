import type { CollectionAfterChangeHook } from 'payload'

async function resolveOrderCartId(
  doc: Record<string, unknown>,
  req: Parameters<CollectionAfterChangeHook>[0]['req'],
): Promise<number | undefined> {
  const checkoutCart = doc.checkoutCart
  if (checkoutCart && typeof checkoutCart === 'object' && 'id' in checkoutCart) {
    return (checkoutCart as { id: number }).id
  }
  if (typeof checkoutCart === 'number') {
    return checkoutCart
  }

  const transactions = doc.transactions as unknown
  const txRef = Array.isArray(transactions) ? transactions[0] : undefined
  if (!txRef) {
    return undefined
  }
  const txId = typeof txRef === 'object' && txRef && 'id' in txRef ? txRef.id : txRef
  if (typeof txId !== 'number') {
    return undefined
  }

  const tx = await req.payload.findByID({
    id: txId,
    collection: 'transactions',
    depth: 0,
    req,
    overrideAccess: true,
  })
  const c = tx?.cart
  if (typeof c === 'object' && c && 'id' in c) {
    return c.id
  }
  if (typeof c === 'number') {
    return c
  }
  return undefined
}

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

  if (operation !== 'create' || context?.skipPromoOrderEnrichment) {
    return doc
  }

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

  if (typeof promoId === 'number') {
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
