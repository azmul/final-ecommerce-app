import {
  inventoryErrorPayload,
  validateCartInventory,
} from '@/lib/inventory/validateCartInventory'
import type { CollectionBeforeChangeHook } from 'payload'
import { APIError } from 'payload'

/**
 * Rejects cart saves when line quantities exceed current product/variant inventory.
 */
export const inventoryCartBeforeChange: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  req,
}) => {
  if (req.context?.skipInventoryCartValidation) {
    return data
  }

  // Only validate when this update explicitly changes line items (not purchasedAt-only saves).
  if (data.items === undefined) {
    return data
  }

  const items = data.items

  if (!items?.length) {
    return data
  }

  const cartId =
    typeof originalDoc?.id === 'number' ? originalDoc.id
    : typeof data?.id === 'number' ? data.id
    : null

  const result = await validateCartInventory({
    cartId,
    payload: req.payload,
    req,
    items,
  })

  if (!result.ok) {
    throw new APIError(inventoryErrorPayload(result), 400)
  }

  return data
}
