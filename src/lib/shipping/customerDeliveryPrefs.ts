/** Normalized checkout delivery inputs derived from address + UI. */

export type CustomerDeliveryArea = 'dhaka' | 'outside_dhaka'

export type CustomerDeliveryType = 'point' | 'home'

export type CustomerDeliveryPrefs = {
  area: CustomerDeliveryArea
  deliveryType: CustomerDeliveryType
}

const DHAKA_METRO_DISTRICTS = new Set([
  'dhaka',
  'faridpur',
  'gazipur',
  'gopalganj',
  'kishoreganj',
  'madaripur',
  'manikganj',
  'munshiganj',
  'narayanganj',
  'narsingdi',
  'rajbari',
  'shariatpur',
  'tangail',
])

/** District name from checkout address (Bangladesh). */
export function normalizeDistrictKey(district: string | undefined | null): string {
  if (!district || typeof district !== 'string') return ''
  return district.trim().toLowerCase().replace(/\s+/g, ' ')
}

/**
 * Treat common spelling variants and metro districts as Dhaka zone for base rates.
 */
export function districtToDeliveryArea(district: string | undefined | null): CustomerDeliveryArea {
  const key = normalizeDistrictKey(district)
  if (!key) return 'outside_dhaka'
  if (key.includes('dhaka')) return 'dhaka'
  if (DHAKA_METRO_DISTRICTS.has(key)) return 'dhaka'
  return 'outside_dhaka'
}
