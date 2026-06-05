import type { Payload, PayloadRequest } from 'payload'

import {
  decrementLocationRows,
  resolveFulfillableInventory,
  totalFromLocationRows,
} from '@/lib/inventory/resolveAvailableInventory'
import { inventoryErrorPayload } from '@/lib/inventory/validateCartInventory'
import { normalizeInventory } from '@/lib/inventory/normalizeInventory'
import { OUT_OF_STOCK_MESSAGE, type InventoryOrderItem } from '@/lib/inventory/types'
import { APIError } from 'payload'

function resolveRelationId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'object' && value !== null && 'id' in value) {
    const id = (value as { id: unknown }).id
    if (typeof id === 'number' && Number.isFinite(id)) return id
  }
  return null
}

function throwOutOfStock(): never {
  throw new APIError(
    inventoryErrorPayload({
      ok: false,
      code: 'OutOfStock',
      message: OUT_OF_STOCK_MESSAGE,
    }),
    400,
  )
}

export async function decrementInventoryForItems(args: {
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

      const available = resolveFulfillableInventory(variant, district)
      if (line.quantity > available) {
        throwOutOfStock()
      }

      const locationRows = Array.isArray(variant.inventoryByLocation) ?
          variant.inventoryByLocation
        : []
      const updateData: Record<string, unknown> = {}

      if (locationRows.length > 0) {
        const beforeTotal = totalFromLocationRows(locationRows) ?? 0
        const nextRows = decrementLocationRows(locationRows, line.quantity, district)
        const afterTotal = totalFromLocationRows(nextRows) ?? 0
        if (beforeTotal - afterTotal < line.quantity) {
          throwOutOfStock()
        }
        updateData.inventoryByLocation = nextRows
        updateData.inventory = afterTotal
      } else {
        updateData.inventory = normalizeInventory(variant.inventory) - line.quantity
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
      const available = resolveFulfillableInventory(product, district)
      if (line.quantity > available) {
        throwOutOfStock()
      }

      const locationRows = Array.isArray(product.inventoryByLocation) ?
          product.inventoryByLocation
        : []
      const updateData: Record<string, unknown> = {}

      if (locationRows.length > 0) {
        const beforeTotal = totalFromLocationRows(locationRows) ?? 0
        const nextRows = decrementLocationRows(locationRows, line.quantity, district)
        const afterTotal = totalFromLocationRows(nextRows) ?? 0
        if (beforeTotal - afterTotal < line.quantity) {
          throwOutOfStock()
        }
        updateData.inventoryByLocation = nextRows
        updateData.inventory = afterTotal
      } else {
        updateData.inventory = normalizeInventory(product.inventory) - line.quantity
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

export { resolveFulfillableInventory as resolveAvailableInventory }
