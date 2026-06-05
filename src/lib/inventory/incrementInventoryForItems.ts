import type { Payload, PayloadRequest } from 'payload'

import {
  incrementLocationRows,
  resolveFulfillableInventory,
  totalFromLocationRows,
} from '@/lib/inventory/resolveAvailableInventory'
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

export async function incrementInventoryForItems(args: {
  district?: string | null
  payload: Payload
  req?: PayloadRequest
  items: InventoryOrderItem[]
}): Promise<void> {
  const { district, payload, req, items } = args
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
        inventoryByLocation: true,
      },
    })

    if (!product) continue

    if (product.enableVariants && line.variant != null) {
      const variant = await payload.findByID({
        id: line.variant,
        collection: 'variants',
        depth: 1,
        overrideAccess: true,
        ...(req ? { req } : {}),
        select: {
          inventory: true,
          inventoryByLocation: true,
        },
      })
      if (!variant) continue

      const locationRows = Array.isArray(variant.inventoryByLocation) ?
          variant.inventoryByLocation
        : []
      const updateData: Record<string, unknown> = {}

      if (locationRows.length > 0) {
        const nextRows = incrementLocationRows(locationRows, line.quantity, district)
        updateData.inventoryByLocation = nextRows
        updateData.inventory = totalFromLocationRows(nextRows) ?? 0
      } else {
        updateData.inventory = normalizeInventory(variant.inventory) + line.quantity
      }

      await payload.update({
        id: line.variant,
        collection: 'variants',
        data: updateData,
        overrideAccess: true,
        ...(req ? { req } : {}),
        context: { skipProductNotificationTriggers: true },
      })
    } else if (!product.enableVariants) {
      const locationRows = Array.isArray(product.inventoryByLocation) ?
          product.inventoryByLocation
        : []
      const updateData: Record<string, unknown> = {}

      if (locationRows.length > 0) {
        const nextRows = incrementLocationRows(locationRows, line.quantity, district)
        updateData.inventoryByLocation = nextRows
        updateData.inventory = totalFromLocationRows(nextRows) ?? 0
      } else {
        updateData.inventory = normalizeInventory(product.inventory) + line.quantity
      }

      await payload.update({
        id: line.product,
        collection: 'products',
        data: updateData,
        overrideAccess: true,
        ...(req ? { req } : {}),
        context: { skipProductNotificationTriggers: true },
      })
    }

    void resolveFulfillableInventory(product, district)
  }
}

export function returnItemsToInventoryLines(
  items: Array<{
    product?: unknown
    variant?: unknown
    quantity?: number | null
  }> | null | undefined,
): InventoryOrderItem[] {
  if (!items?.length) return []

  const lines: InventoryOrderItem[] = []
  for (const item of items) {
    const productId = resolveRelationId(item.product)
    const quantity = typeof item.quantity === 'number' ? item.quantity : 0
    if (productId == null || quantity <= 0) continue
    const variantId = resolveRelationId(item.variant)
    lines.push({
      product: productId,
      ...(variantId != null ? { variant: variantId } : {}),
      quantity,
    })
  }
  return lines
}
