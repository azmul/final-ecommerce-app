import { notifyStaffLowStock } from '@/lib/inventory/notifyStaffLowStock'
import type { CollectionAfterChangeHook } from 'payload'

export const checkProductLowStock: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
  context,
}) => {
  if (context?.skipProductNotificationTriggers) {
    return doc
  }

  if (doc.enableVariants) {
    return doc
  }

  const currentInventory = typeof doc.inventory === 'number' ? doc.inventory : null
  const previousInventory =
    previousDoc && typeof previousDoc.inventory === 'number' ? previousDoc.inventory : null

  if (currentInventory === previousInventory && !doc.inventoryByLocation) {
    return doc
  }

  await notifyStaffLowStock({
    collection: 'products',
    doc: doc as {
      id: number
      inventory?: number | null
      inventoryByLocation?: { quantity?: number | null }[] | null
      reorderLevel?: number | null
      title?: string | null
    },
    payload: req.payload,
    req,
  })

  return doc
}
