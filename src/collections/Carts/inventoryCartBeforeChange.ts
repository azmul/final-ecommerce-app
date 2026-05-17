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
  req,
  originalDoc,
}) => {
  if (req.context?.skipInventoryCartValidation) {
    return data
  }

  const items =
    data.items !== undefined ? data.items : (originalDoc?.items as typeof data.items | undefined)

  if (!items?.length) {
    return data
  }

  const result = await validateCartInventory({
    payload: req.payload,
    req,
    items,
  })

  if (!result.ok) {
    throw new APIError(inventoryErrorPayload(result), 400)
  }

  return data
}
