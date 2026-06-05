import { normalizeInventory } from '@/lib/inventory/normalizeInventory'
import {
  resolveFulfillableInventory,
  totalFromLocationRows,
} from '@/lib/inventory/resolveAvailableInventory'
import { describe, expect, it } from 'vitest'

describe('inventory utilities', () => {
  it('normalizes inventory values', () => {
    expect(normalizeInventory(5.9)).toBe(5)
    expect(normalizeInventory('3')).toBe(3)
    expect(normalizeInventory(null)).toBe(0)
    expect(normalizeInventory(-2)).toBe(0)
  })

  it('sums location rows for fulfillable inventory', () => {
    expect(
      resolveFulfillableInventory({
        inventory: 0,
        inventoryByLocation: [
          { quantity: 2 },
          { quantity: 3 },
        ],
      }),
    ).toBe(5)
  })

  it('falls back to global inventory when no location rows', () => {
    expect(resolveFulfillableInventory({ inventory: 7 })).toBe(7)
  })

  it('totalFromLocationRows returns null for empty rows', () => {
    expect(totalFromLocationRows([])).toBeNull()
  })
})
