import { resolveAvailableInventory } from '@/lib/inventory/resolveAvailableInventory'
import type { Payload, PayloadRequest } from 'payload'

type InventoryRecord = {
  id: number
  inventory?: unknown
  inventoryByLocation?: { quantity?: number | null }[] | null
  reorderLevel?: number | null
  title?: string | null
}

export async function notifyStaffLowStock(args: {
  collection: 'products' | 'variants'
  doc: InventoryRecord
  payload: Payload
  productTitle?: string
  req?: PayloadRequest
}) {
  const { collection, doc, payload, productTitle, req } = args
  const reorderLevel =
    typeof doc.reorderLevel === 'number' && doc.reorderLevel >= 0 ? doc.reorderLevel : 5
  const inventory = resolveAvailableInventory(doc)

  if (inventory > reorderLevel) return

  const staffUsers = await payload.find({
    collection: 'users',
    depth: 0,
    limit: 50,
    overrideAccess: true,
    ...(req ? { req } : {}),
    where: {
      roles: {
        in: ['admin', 'officeStaff'],
      },
    },
  })

  const label =
    collection === 'variants' ?
      `${productTitle ?? 'Product'} — ${doc.title ?? `Variant #${doc.id}`}`
    : (doc.title ?? `Product #${doc.id}`)

  const title = 'Low stock alert'
  const body = `${label} is down to ${inventory} unit(s) (reorder level: ${reorderLevel}).`
  const linkUrl = `/admin/collections/${collection}/${doc.id}`

  await Promise.all(
    staffUsers.docs.map((user) =>
      payload.create({
        collection: 'user-notifications',
        data: {
          body,
          channels: ['inbox'],
          kind: 'system',
          linkUrl,
          title,
          user: user.id,
        },
        overrideAccess: true,
        ...(req ? { req } : {}),
      }),
    ),
  )
}
