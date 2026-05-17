import { getSiteSeoConfig } from '@/lib/seo/siteConfig'

export function getGeoSiteContext() {
  const site = getSiteSeoConfig()
  return {
    siteName: site.name,
    country: site.country === 'BD' ? 'Bangladesh' : site.country,
    currency: site.currency,
    deliveryNote:
      'We deliver nationwide across Bangladesh. Delivery times vary by district; you will see options at checkout.',
    returnsNote:
      'Unused items in original packaging may be returned within 7 days of delivery. Opened intimate apparel is excluded for hygiene reasons unless faulty.',
  }
}
