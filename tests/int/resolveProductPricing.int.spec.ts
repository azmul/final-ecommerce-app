import { describe, expect, it } from 'vitest'

import { formatAiProduct } from '@/lib/ai/formatProduct'
import { resolveProductPricing } from '@/lib/ecommerce/resolveProductPricing'
import type { Product, Variant } from '@/payload-types'

const baseProduct = {
  discountPercentage: 10,
  enableVariants: false,
  id: 1,
  inventory: 5,
  priceInBDT: 1000,
  slug: 'test-product',
  title: 'Test Product',
} as Product

describe('resolveProductPricing', () => {
  it('applies discount to simple products', () => {
    const pricing = resolveProductPricing(baseProduct)

    expect(pricing.listLow).toBe(1000)
    expect(pricing.saleLow).toBe(900)
    expect(pricing.hasDiscount).toBe(true)
    expect(pricing.isRange).toBe(false)
  })

  it('returns variant price ranges with discounted highs and lows', () => {
    const product = {
      ...baseProduct,
      enableVariants: true,
      priceInBDT: 500,
    } as Product

    const variants = [
      { id: 11, inventory: 2, priceInBDT: 1200, product: 1 },
      { id: 12, inventory: 1, priceInBDT: 1500, product: 1 },
    ] as Variant[]

    const pricing = resolveProductPricing(product, variants)

    expect(pricing.listLow).toBe(1200)
    expect(pricing.listHigh).toBe(1500)
    expect(pricing.saleLow).toBe(1080)
    expect(pricing.saleHigh).toBe(1350)
    expect(pricing.isRange).toBe(true)
  })
})

describe('formatAiProduct pricing fields', () => {
  it('maps resolved pricing into AI product results', () => {
    const product = {
      ...baseProduct,
      enableVariants: true,
    } as Product

    const variants = [
      {
        id: 21,
        inventory: 2,
        options: [{ id: 101, label: 'Size', value: '500ml' }],
        priceInBDT: 2000,
        product: 1,
      },
      {
        id: 22,
        inventory: 1,
        options: [{ id: 102, label: 'Size', value: '1L' }],
        priceInBDT: 2500,
        product: 1,
      },
    ] as Variant[]

    const result = formatAiProduct({ product, variants })

    expect(result.price).toBe(2000)
    expect(result.priceHigh).toBe(2500)
    expect(result.salePrice).toBe(1800)
    expect(result.salePriceHigh).toBe(2250)
    expect(result.variantsSummary?.[0]?.label).toContain('Size: 500ml')
    expect(result.variantsSummary?.[1]?.salePrice).toBe(2250)
  })
})
