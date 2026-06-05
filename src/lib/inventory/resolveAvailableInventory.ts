import { normalizeInventory } from '@/lib/inventory/normalizeInventory'

export type InventoryByLocationRow = {
  location?:
    | number
    | {
        district?: string | null
        id?: number
        isDefault?: boolean | null
      }
    | null
  quantity?: number | null
}

export function totalFromLocationRows(
  rows: InventoryByLocationRow[] | null | undefined,
): number | null {
  if (!rows?.length) return null
  return rows.reduce((sum, row) => sum + (typeof row.quantity === 'number' ? row.quantity : 0), 0)
}

export function resolveAvailableInventory(record: {
  inventory?: unknown
  inventoryByLocation?: InventoryByLocationRow[] | null
}): number {
  return resolveFulfillableInventory(record)
}

/**
 * Maximum quantity fulfillable for an order line (matches multi-location decrement capacity).
 */
export function resolveFulfillableInventory(
  record: {
    inventory?: unknown
    inventoryByLocation?: InventoryByLocationRow[] | null
  },
  district?: string | null,
): number {
  const rows = record.inventoryByLocation
  if (rows?.length) {
    void district
    return rows.reduce(
      (sum, row) => sum + Math.max(0, typeof row.quantity === 'number' ? row.quantity : 0),
      0,
    )
  }
  void district
  return normalizeInventory(record.inventory)
}

export function resolveLocationId(
  location: InventoryByLocationRow['location'],
): number | null {
  if (typeof location === 'number' && Number.isFinite(location)) return location
  if (location && typeof location === 'object' && typeof location.id === 'number') {
    return location.id
  }
  return null
}

export function pickFulfillmentLocationIndex(
  rows: InventoryByLocationRow[],
  district?: string | null,
): number {
  if (!rows.length) return -1

  const normalizedDistrict = typeof district === 'string' ? district.trim().toLowerCase() : ''

  if (normalizedDistrict) {
    const districtMatch = rows.findIndex((row) => {
      const loc = row.location
      const districtValue =
        loc && typeof loc === 'object' && typeof loc.district === 'string' ?
          loc.district.trim().toLowerCase()
        : ''
      return districtValue === normalizedDistrict && (row.quantity ?? 0) > 0
    })
    if (districtMatch >= 0) return districtMatch
  }

  const defaultMatch = rows.findIndex((row) => {
    const loc = row.location
    return (
      loc &&
      typeof loc === 'object' &&
      loc.isDefault === true &&
      (row.quantity ?? 0) > 0
    )
  })
  if (defaultMatch >= 0) return defaultMatch

  return rows.findIndex((row) => (row.quantity ?? 0) > 0)
}

export function decrementLocationRows(
  rows: InventoryByLocationRow[],
  quantity: number,
  district?: string | null,
): InventoryByLocationRow[] {
  const next = rows.map((row) => ({ ...row }))
  let remaining = quantity
  let index = pickFulfillmentLocationIndex(next, district)

  while (remaining > 0 && index >= 0) {
    const row = next[index]
    const available = typeof row.quantity === 'number' ? row.quantity : 0
    if (available <= 0) {
      index = pickFulfillmentLocationIndex(
        next.filter((_, i) => i !== index),
        district,
      )
      continue
    }

    const take = Math.min(available, remaining)
    row.quantity = available - take
    remaining -= take

    if (remaining > 0) {
      const fallbackRows = next.map((r, i) => (i === index ? { ...r, quantity: 0 } : r))
      index = pickFulfillmentLocationIndex(fallbackRows, district)
    }
  }

  return next
}

export function incrementLocationRows(
  rows: InventoryByLocationRow[],
  quantity: number,
  district?: string | null,
): InventoryByLocationRow[] {
  const next = rows.map((row) => ({ ...row }))
  if (!next.length) return next

  let remaining = quantity
  let index = pickFulfillmentLocationIndex(next, district)
  if (index < 0) index = 0

  while (remaining > 0 && index >= 0 && index < next.length) {
    const row = next[index]
    const current = typeof row.quantity === 'number' ? row.quantity : 0
    row.quantity = current + remaining
    remaining = 0
  }

  return next
}
