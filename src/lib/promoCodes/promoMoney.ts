import { BDT } from '@/lib/ecommerceCurrency'

/**
 * Cart subtotals and `priceInBDT` use minor currency units (e.g. poisha for BDT).
 * Promo admin fields (fixed discount, caps, minimum order) are entered as **whole currency units** (taka).
 */
export function promoMajorUnitsToMinor(
  amount: number,
  decimals: number = BDT.decimals,
): number {
  const f = 10 ** decimals
  return Math.round(amount * f)
}
