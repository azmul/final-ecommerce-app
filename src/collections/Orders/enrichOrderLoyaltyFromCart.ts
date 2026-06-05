import { resolveOrderCartId } from '@/collections/Orders/resolveOrderCartId'
import type { CollectionAfterChangeHook } from 'payload'

export const enrichOrderLoyaltyFromCart: CollectionAfterChangeHook = async ({
  doc,
  req,
  operation,
  context,
}) => {
  if (operation !== 'create' || context?.skipLoyaltyOrderEnrichment) return doc

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

  const points =
    typeof cart.appliedLoyaltyPoints === 'number' ? cart.appliedLoyaltyPoints : null
  const discount =
    typeof cart.loyaltyDiscountAmount === 'number' ? cart.loyaltyDiscountAmount : null

  if (!points && !discount) return doc

  await req.payload.update({
    id: doc.id,
    collection: 'orders',
    data: {
      appliedLoyaltyPoints: points,
      loyaltyDiscountAmount: discount,
    },
    overrideAccess: true,
    req,
    context: { ...context, skipLoyaltyOrderEnrichment: true },
  })

  return doc
}
