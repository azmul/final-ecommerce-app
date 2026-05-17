import {
  decrementInventoryForItems,
  orderItemsToInventoryLines,
} from '@/lib/inventory/decrementInventoryForItems'
import type { CollectionAfterChangeHook } from 'payload'

/**
 * Decrements product/variant inventory when an order is created (all payment methods).
 */
export const decrementInventoryOnOrderCreate: CollectionAfterChangeHook = async ({
  doc,
  req,
  operation,
  context,
}) => {
  if (operation !== 'create' || context?.skipInventoryDecrement) {
    return doc
  }

  const lines = orderItemsToInventoryLines((doc as { items?: unknown }).items)
  if (!lines.length) {
    return doc
  }

  await decrementInventoryForItems({
    payload: req.payload,
    req,
    items: lines,
  })

  return doc
}
