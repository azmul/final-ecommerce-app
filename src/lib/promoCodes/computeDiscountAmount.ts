import { promoMajorUnitsToMinor } from '@/lib/promoCodes/promoMoney'
import type { CartLineForPromo } from '@/lib/promoCodes/types'

export type PromoDiscountRule = {
  discountType: 'percentage' | 'fixed'
  discountPercentage?: number | null
  discountFixedAmount?: number | null
  maxDiscountAmount?: number | null
}

export function sumLineTotals(lines: CartLineForPromo[]): number {
  return lines.reduce((sum, line) => sum + line.lineSubtotal, 0)
}

/**
 * Monetary amounts are in the same minor units as {@link priceInBDT} / cart subtotal.
 */
export function computeDiscountAmount(args: {
  rawCartSubtotal: number
  eligibleLines: CartLineForPromo[]
  rule: PromoDiscountRule
}): number {
  const { rawCartSubtotal, eligibleLines, rule } = args
  const eligibleSubtotal = sumLineTotals(eligibleLines)

  if (eligibleSubtotal <= 0 || rawCartSubtotal <= 0) {
    return 0
  }

  let discount = 0

  if (rule.discountType === 'percentage') {
    const pct = rule.discountPercentage ?? 0
    const clampedPct = Math.min(Math.max(pct, 0), 100)
    discount = Math.round((eligibleSubtotal * clampedPct) / 100)
    const capMajor =
      typeof rule.maxDiscountAmount === 'number' && Number.isFinite(rule.maxDiscountAmount) ?
        rule.maxDiscountAmount
      : null
    if (capMajor !== null && capMajor > 0) {
      const capMinor = promoMajorUnitsToMinor(capMajor)
      discount = Math.min(discount, capMinor)
    }
  } else {
    const fixedMajor = rule.discountFixedAmount ?? 0
    discount = Math.max(0, promoMajorUnitsToMinor(Math.max(0, fixedMajor)))
  }

  discount = Math.min(discount, eligibleSubtotal, rawCartSubtotal)
  return Math.max(0, discount)
}

export function filterEligibleLines(
  lines: CartLineForPromo[],
  args: {
    restrictToProductIds: number[]
    excludeProductIds: number[]
    excludeCategoryIds: number[]
  },
): CartLineForPromo[] {
  const restrict = args.restrictToProductIds
  const hasRestriction = restrict.length > 0

  return lines.filter((line) => {
    if (args.excludeProductIds.includes(line.productId)) {
      return false
    }
    if (args.excludeCategoryIds.some((cid) => line.categoryIds.includes(cid))) {
      return false
    }
    if (hasRestriction && !restrict.includes(line.productId)) {
      return false
    }
    return true
  })
}
