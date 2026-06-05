import type { Product, Variant } from '@/payload-types'

export type ResolvedProductPricing = {
  discountPercent: number
  hasDiscount: boolean
  hasVariants: boolean
  isRange: boolean
  listHigh: number | null
  listLow: number | null
  saleHigh: number | null
  saleLow: number | null
}

function getDiscountPercent(product: Product): number {
  const discountFromField =
    typeof product.discountPercentage === 'number' ? Math.round(product.discountPercentage) : 0
  return Math.min(Math.max(discountFromField, 0), 100)
}

function applyDiscount(value: number, discountPercent: number): number {
  return discountPercent > 0 ? Math.round(value * (100 - discountPercent)) / 100 : value
}

function getVariantPrices(variants: Variant[]): number[] {
  return variants
    .map((variant) => variant.priceInBDT)
    .filter((price): price is number => typeof price === 'number')
}

export function resolveProductPricing(
  product: Product,
  variants: Variant[] = [],
): ResolvedProductPricing {
  const discountPercent = getDiscountPercent(product)
  const hasDiscount = discountPercent > 0
  const hasVariants = Boolean(product.enableVariants && variants.length)

  if (hasVariants) {
    const prices = getVariantPrices(variants)

    if (!prices.length) {
      const amount = typeof product.priceInBDT === 'number' ? product.priceInBDT : null

      return {
        discountPercent,
        hasDiscount,
        hasVariants: true,
        isRange: false,
        listHigh: amount,
        listLow: amount,
        saleHigh: amount != null ? applyDiscount(amount, discountPercent) : null,
        saleLow: amount != null ? applyDiscount(amount, discountPercent) : null,
      }
    }

    const low = Math.min(...prices)
    const high = Math.max(...prices)

    return {
      discountPercent,
      hasDiscount,
      hasVariants: true,
      isRange: low !== high,
      listHigh: high,
      listLow: low,
      saleHigh: applyDiscount(high, discountPercent),
      saleLow: applyDiscount(low, discountPercent),
    }
  }

  const amount = typeof product.priceInBDT === 'number' ? product.priceInBDT : null

  return {
    discountPercent,
    hasDiscount,
    hasVariants: false,
    isRange: false,
    listHigh: amount,
    listLow: amount,
    saleHigh: amount != null ? applyDiscount(amount, discountPercent) : null,
    saleLow: amount != null ? applyDiscount(amount, discountPercent) : null,
  }
}
