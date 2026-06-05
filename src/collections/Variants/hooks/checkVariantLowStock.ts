import { notifyStaffLowStock } from '@/lib/inventory/notifyStaffLowStock'
import type { CollectionAfterChangeHook } from 'payload'

export const checkVariantLowStock: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
}) => {
  const currentInventory = typeof doc.inventory === 'number' ? doc.inventory : null
  const previousInventory =
    previousDoc && typeof previousDoc.inventory === 'number' ? previousDoc.inventory : null

  if (currentInventory === previousInventory && !doc.inventoryByLocation) {
    return doc
  }

  const product = doc.product
  const productTitle =
    product && typeof product === 'object' && typeof product.title === 'string' ?
      product.title
    : undefined

  await notifyStaffLowStock({
    collection: 'variants',
    doc: doc as {
      id: number
      inventory?: number | null
      inventoryByLocation?: { quantity?: number | null }[] | null
      reorderLevel?: number | null
      title?: string | null
    },
    payload: req.payload,
    productTitle,
    req,
  })

  return doc
}
