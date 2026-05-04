import { BDT } from '@/lib/ecommerceCurrency'

const MINOR_FACTOR = Math.pow(10, BDT.decimals)

/** Same base representation as `@payloadcms/plugin-ecommerce` (`convertFromBaseValue`). */
export function minorUnitsToMajor(amountMinor: number): number {
  return amountMinor / MINOR_FACTOR
}

/**
 * Sentence copy aligned with admin/storefront (major units, fixed decimals).
 * Keeps `parsePriceDropFromBody` unambiguous vs legacy integer-only minor bodies.
 */
export function formatMajorDecimalsFromMinor(amountMinor: number): string {
  return minorUnitsToMajor(amountMinor).toFixed(BDT.decimals)
}

/** Matches copy emitted by `triggerInventoryAndPrice`. */
const PRICE_DROP_BODY =
  /dropped to (\d+(?:\.\d+)?) BDT \(was (\d+(?:\.\d+)?)\)/

/**
 * Returns **minor-unit** amounts for formatting with `formatBdtAmount`.
 * - Integer tokens without `.` → stored minor units (legacy bodies).
 * - Decimal tokens → major units from new copy → converted to minor.
 */
export function parsePriceDropFromBody(body: string): { previous: number; now: number } | null {
  const m = body.match(PRICE_DROP_BODY)
  if (!m) return null
  const toMinor = (raw: string): number => {
    const n = Number(raw)
    if (!Number.isFinite(n)) return Number.NaN
    return raw.includes('.') ? Math.round(n * MINOR_FACTOR) : n
  }
  const now = toMinor(m[1])
  const previous = toMinor(m[2])
  if (!Number.isFinite(now) || !Number.isFinite(previous)) return null
  return { now, previous }
}

/** Formats an ecommerce **minor-unit** amount as BDT (matches storefront `Price`). */
export function formatBdtAmount(amountMinor: number): string {
  const major = minorUnitsToMajor(amountMinor)
  return new Intl.NumberFormat('en-US', {
    currency: 'BDT',
    currencyDisplay: 'narrowSymbol',
    maximumFractionDigits: BDT.decimals,
    minimumFractionDigits: Number.isInteger(major) ? 0 : BDT.decimals,
    style: 'currency',
  }).format(major)
}
