import { normalizeInventory } from '@/lib/inventory/normalizeInventory'
import { describe, expect, it } from 'vitest'

describe('inventory utilities', () => {
  it('normalizes inventory values', () => {
    expect(normalizeInventory(5.9)).toBe(5)
    expect(normalizeInventory('3')).toBe(3)
    expect(normalizeInventory(null)).toBe(0)
    expect(normalizeInventory(-2)).toBe(0)
  })
})
