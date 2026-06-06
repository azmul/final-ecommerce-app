import type { CollectionBeforeChangeHook } from 'payload'

/**
 * When checkout marks a cart purchased, empty line items in the same save so the
 * active cart UI starts fresh (Stripe, COD, and any other confirm-order path).
 */
export const finalizePurchasedCart: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  req,
}) => {
  if (!data?.purchasedAt || originalDoc?.purchasedAt) {
    return data
  }

  req.context = {
    ...req.context,
    skipInventoryCartValidation: true,
  }

  return {
    ...data,
    items: [],
  }
}
