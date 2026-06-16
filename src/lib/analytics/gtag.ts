'use client'

import type { MetaCustomData } from '@/lib/analytics/meta/types'
import type { AnalyticsEventType } from '@/hooks/useAnalyticsEvent'

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[]
    gtag?: (...args: unknown[]) => void
  }
}

const GA4_EVENT_MAP: Partial<Record<AnalyticsEventType, string>> = {
  product_view: 'view_item',
  add_to_cart: 'add_to_cart',
  begin_checkout: 'begin_checkout',
  add_payment_info: 'add_payment_info',
  purchase: 'purchase',
  search: 'search',
}

function gaItemsFromCustomData(customData?: MetaCustomData) {
  if (!customData?.contents?.length) return undefined

  return customData.contents.map((item) => ({
    item_id: item.id,
    item_name: item.title,
    item_category: item.category,
    price: item.item_price,
    quantity: item.quantity ?? 1,
  }))
}

function pushDataLayer(event: string, params: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ event, ...params })
}

/** Fire GA4 recommended e-commerce event via gtag or GTM dataLayer. */
export function trackGa4Event(
  eventType: AnalyticsEventType,
  customData?: MetaCustomData,
  metadata?: Record<string, unknown>,
): void {
  if (typeof window === 'undefined') return

  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim()
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID?.trim()
  if (!gaId && !gtmId) return

  const gaEvent = GA4_EVENT_MAP[eventType]
  if (!gaEvent) return

  const currency = customData?.currency ?? 'BDT'
  const items = gaItemsFromCustomData(customData)
  const value = customData?.value

  const params: Record<string, unknown> = {
    currency,
    ...(typeof value === 'number' ? { value } : {}),
    ...(items ? { items } : {}),
    ...(eventType === 'search' && typeof metadata?.search_string === 'string' ?
      { search_term: metadata.search_string }
    : eventType === 'search' && typeof customData?.search_string === 'string' ?
      { search_term: customData.search_string }
    : {}),
    ...(eventType === 'purchase' && customData?.order_id ?
      { transaction_id: customData.order_id }
    : {}),
  }

  if (gtmId) {
    pushDataLayer(gaEvent, params)
    return
  }

  if (typeof window.gtag === 'function' && gaId) {
    window.gtag('event', gaEvent, params)
  }
}
