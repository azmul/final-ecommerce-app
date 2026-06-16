import type { CustomerDeliveryPrefs } from '@/lib/shipping/customerDeliveryPrefs'

export type DeliveryEtaEstimate = {
  label: string
  minDays: number
  maxDays: number
}

/** Rough delivery window for storefront display (Bangladesh-focused). */
export function estimateDeliveryEta(prefs?: Partial<CustomerDeliveryPrefs>): DeliveryEtaEstimate {
  const area = prefs?.area === 'outside_dhaka' ? 'outside_dhaka' : 'dhaka'
  const deliveryType = prefs?.deliveryType === 'point' ? 'point' : 'home'

  if (area === 'dhaka') {
    return deliveryType === 'home' ?
        { label: '1–2 business days in Dhaka', minDays: 1, maxDays: 2 }
      : { label: '1–3 business days to Dhaka pickup point', minDays: 1, maxDays: 3 }
  }

  return deliveryType === 'home' ?
      { label: '3–5 business days outside Dhaka', minDays: 3, maxDays: 5 }
    : { label: '4–6 business days to pickup point', minDays: 4, maxDays: 6 }
}

export function formatDeliveryEtaRange(eta: DeliveryEtaEstimate): string {
  if (eta.minDays === eta.maxDays) {
    return `${eta.minDays} business day${eta.minDays === 1 ? '' : 's'}`
  }

  return `${eta.minDays}–${eta.maxDays} business days`
}
