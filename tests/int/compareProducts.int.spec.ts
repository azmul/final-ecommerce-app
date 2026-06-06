import { describe, expect, it } from 'vitest'

import { formatComparePriceLabel } from '@/lib/ai/compareProducts'
import type { Product } from '@/payload-types'

describe('formatComparePriceLabel', () => {
  it('converts minor-unit prices to major BDT for AI comparison', () => {
    const product = {
      discountPercentage: 0,
      enableVariants: false,
      id: 1,
      inventory: 5,
      priceInBDT: 100_000,
      slug: 'priced-product',
      title: 'Priced Product',
    } as Product

    expect(formatComparePriceLabel(product)).toBe('৳1,000')
  })

  it('includes discounted sale price when a discount applies', () => {
    const product = {
      discountPercentage: 1,
      enableVariants: false,
      id: 2,
      inventory: 5,
      priceInBDT: 100_000,
      slug: 'sale-product',
      title: 'Sale Product',
    } as Product

    expect(formatComparePriceLabel(product)).toBe('৳990 (was ৳1,000, −1%)')
  })
})
