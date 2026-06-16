import { describe, expect, it } from 'vitest'

import {
  estimateDeliveryEta,
  formatDeliveryEtaRange,
} from '@/lib/shipping/estimateDeliveryEta'
import { generateGiftCardCode } from '@/lib/giftCards/generateGiftCardCode'
import { parseShopSearchParams } from '@/lib/search/parseShopSearchParams'

describe('estimateDeliveryEta', () => {
  it('returns Dhaka home delivery window', () => {
    const eta = estimateDeliveryEta({ area: 'dhaka', deliveryType: 'home' })
    expect(eta.minDays).toBe(1)
    expect(eta.maxDays).toBe(2)
    expect(eta.label).toContain('Dhaka')
  })

  it('returns outside Dhaka pickup window', () => {
    const eta = estimateDeliveryEta({ area: 'outside_dhaka', deliveryType: 'point' })
    expect(eta.minDays).toBeGreaterThanOrEqual(4)
    expect(formatDeliveryEtaRange(eta)).toMatch(/business days/)
  })
})

describe('generateGiftCardCode', () => {
  it('produces normalized uppercase codes', () => {
    const code = generateGiftCardCode()
    expect(code).toMatch(/^GC-[A-Z0-9]{10,}$/)
  })
})

describe('parseShopSearchParams variant filters', () => {
  it('parses comma-separated variant option ids from vopt', () => {
    const parsed = parseShopSearchParams({ vopt: '12,34, 56' })
    expect(parsed.variantOptionIds).toEqual([12, 34, 56])
  })
})
