import type { CollectionBeforeChangeHook } from 'payload'

/**
 * Once a cart is checked out (`purchasedAt` set), any later item change starts a new session.
 * Without this, `clearCart` / add-item reuse the same cart id and confirm-order returns 409.
 */
export const resetPurchasedAtOnCartUpdate: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
}) => {
  if (!originalDoc?.purchasedAt) {
    return data
  }

  if (!('items' in data)) {
    return data
  }

  return {
    ...data,
    purchasedAt: null,
  }
}
