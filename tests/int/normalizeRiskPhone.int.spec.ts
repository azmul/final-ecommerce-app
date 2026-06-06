import { describe, expect, it } from 'vitest'

import {
  normalizeAddressKey,
  normalizeRiskPhone,
  phoneSearchVariants,
} from '@/lib/risk/normalizeRiskPhone'

describe('normalizeRiskPhone', () => {
  it('normalizes Bangladesh phone numbers to digits', () => {
    expect(normalizeRiskPhone('01712345678')).toBe('01712345678')
    expect(normalizeRiskPhone('+880 1712 345 678')).toBe('8801712345678')
  })

  it('returns null for invalid phone values', () => {
    expect(normalizeRiskPhone('')).toBeNull()
    expect(normalizeRiskPhone('123')).toBeNull()
  })

  it('builds phone search variants including synthetic login emails', () => {
    const variants = phoneSearchVariants('01712345678')
    expect(variants).toContain('8801712345678')
    expect(variants.length).toBeGreaterThan(0)
  })

  it('normalizes address keys for duplicate detection', () => {
    expect(
      normalizeAddressKey('Dhaka', 'House 12, Road 5, Banani'),
    ).toBe('dhaka|house 12, road 5, banani')
    expect(normalizeAddressKey('', 'House 12')).toBeNull()
  })
})
