import { resolveOrderCartId } from '@/collections/Orders/resolveOrderCartId'
import type { CollectionAfterChangeHook } from 'payload'

export const enrichOrderGiftCardFromCart: CollectionAfterChangeHook = async ({
  doc,
  req,
  operation,
  context,
}) => {
  if (operation !== 'create' || context?.skipGiftCardOrderEnrichment) return doc

  const cartId = await resolveOrderCartId(doc as Record<string, unknown>, req)
  if (!cartId) return doc

  const cart = await req.payload.findByID({
    id: cartId,
    collection: 'carts',
    depth: 0,
    overrideAccess: true,
    req,
  })

  if (!cart) return doc

  const discount =
    typeof cart.giftCardDiscountAmount === 'number' ? cart.giftCardDiscountAmount : null
  if (!discount) return doc

  await req.payload.update({
    id: doc.id,
    collection: 'orders',
    data: {
      appliedGiftCardCode: cart.appliedGiftCardCode ?? null,
      checkoutCart: cartId,
      giftCard: cart.giftCard ?? null,
      giftCardDiscountAmount: discount,
    },
    overrideAccess: true,
    req,
    context: { ...context, skipGiftCardOrderEnrichment: true },
  })

  return doc
}
