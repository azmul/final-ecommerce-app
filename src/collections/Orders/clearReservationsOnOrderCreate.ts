import { clearReservationsForCart } from '@/lib/inventory/reservations'
import { resolveOrderCartId } from '@/collections/Orders/resolveOrderCartId'
import type { CollectionAfterChangeHook } from 'payload'

export const clearReservationsOnOrderCreate: CollectionAfterChangeHook = async ({
  doc,
  req,
  operation,
}) => {
  if (operation !== 'create') return doc

  const cartId = await resolveOrderCartId(doc as Record<string, unknown>, req)
  if (!cartId) return doc

  await clearReservationsForCart({
    cartId,
    payload: req.payload,
    req,
  })

  return doc
}
