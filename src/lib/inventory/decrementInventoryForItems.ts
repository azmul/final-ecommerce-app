import type { Payload, PayloadRequest } from 'payload'

import { normalizeInventory } from '@/lib/inventory/normalizeInventory'
import type { InventoryOrderItem } from '@/lib/inventory/types'

function resolveRelationId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'object' && value !== null && 'id' in value) {
    const id = (value as { id: unknown }).id
    if (typeof id === 'number' && Number.isFinite(id)) return id
  }
  return null
}

export async function decrementInventoryForItems(args: {
  payload: Payload
  req?: PayloadRequest
  items: InventoryOrderItem[]
}): Promise<void> {
  const { payload, req, items } = args
  const aggregated = new Map<string, InventoryOrderItem>()

  for (const item of items) {
    const qty = typeof item.quantity === 'number' ? item.quantity : 0
    if (qty <= 0 || !Number.isFinite(item.product)) continue
    const key = `${item.product}:${item.variant ?? 'none'}`
    const existing = aggregated.get(key)
    if (existing) {
      existing.quantity += qty
    } else {
      aggregated.set(key, { ...item })
    }
  }

  for (const line of aggregated.values()) {
    const product = await payload.findByID({
      id: line.product,
      collection: 'products',
      depth: 0,
      overrideAccess: true,
      ...(req ? { req } : {}),
      select: {
        enableVariants: true,
        inventory: true,
      },
    })

    if (!product) continue

    if (product.enableVariants && line.variant != null) {
      const variant = await payload.findByID({
        id: line.variant,
        collection: 'variants',
        depth: 0,
        overrideAccess: true,
        ...(req ? { req } : {}),
        select: { inventory: true },
      })
      if (!variant) continue

      const next = Math.max(0, normalizeInventory(variant.inventory) - line.quantity)
      await payload.update({
        id: line.variant,
        collection: 'variants',
        data: { inventory: next },
        overrideAccess: true,
        ...(req ? { req } : {}),
        context: { skipProductNotificationTriggers: true },
      })
    } else if (!product.enableVariants) {
      const next = Math.max(0, normalizeInventory(product.inventory) - line.quantity)
      await payload.update({
        id: line.product,
        collection: 'products',
        data: { inventory: next },
        overrideAccess: true,
        ...(req ? { req } : {}),
        context: { skipProductNotificationTriggers: true },
      })
    }
  }
}

export function orderItemsToInventoryLines(items: unknown): InventoryOrderItem[] {
  if (!Array.isArray(items)) return []

  const lines: InventoryOrderItem[] = []

  for (const item of items) {
    if (!item || typeof item !== 'object') continue
    const record = item as Record<string, unknown>
    const productId = resolveRelationId(record.product)
    const quantity = typeof record.quantity === 'number' ? record.quantity : 0
    if (productId == null || quantity <= 0) continue

    const variantId = resolveRelationId(record.variant)
    lines.push({
      product: productId,
      ...(variantId != null ? { variant: variantId } : {}),
      quantity,
    })
  }

  return lines
}
