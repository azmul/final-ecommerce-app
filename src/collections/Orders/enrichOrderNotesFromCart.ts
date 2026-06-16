import { resolveOrderCartId } from '@/collections/Orders/resolveOrderCartId'
import type { Order } from '@/payload-types'
import type { CollectionAfterChangeHook } from 'payload'

const DELIVERY_TIME_SLOTS = ['morning', 'afternoon', 'evening'] as const

function normalizeDeliveryTimeSlot(
  value: unknown,
): Order['deliveryTimeSlot'] | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return DELIVERY_TIME_SLOTS.includes(trimmed as (typeof DELIVERY_TIME_SLOTS)[number]) ?
      (trimmed as Order['deliveryTimeSlot'])
    : null
}

/** Copies checkout notes and gift message from cart to order. */
export const enrichOrderNotesFromCart: CollectionAfterChangeHook = async ({
  doc,
  req,
  operation,
  context,
}) => {
  if (operation !== 'create' || context?.skipOrderNotesEnrichment) {
    return doc
  }

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

  const customerNote =
    typeof cart.customerNote === 'string' && cart.customerNote.trim() ?
      cart.customerNote.trim()
    : null
  const giftMessage =
    typeof cart.giftMessage === 'string' && cart.giftMessage.trim() ?
      cart.giftMessage.trim()
    : null
  const preferredDeliveryDate =
    typeof cart.preferredDeliveryDate === 'string' && cart.preferredDeliveryDate ?
      cart.preferredDeliveryDate
    : null
  const deliveryTimeSlot = normalizeDeliveryTimeSlot(cart.deliveryTimeSlot)

  if (!customerNote && !giftMessage && !preferredDeliveryDate && !deliveryTimeSlot) return doc

  await req.payload.update({
    id: doc.id,
    collection: 'orders',
    data: {
      customerNote,
      deliveryTimeSlot,
      giftMessage,
      preferredDeliveryDate,
    },
    overrideAccess: true,
    req,
    context: {
      ...context,
      skipOrderNotesEnrichment: true,
    },
  })

  return doc
}
