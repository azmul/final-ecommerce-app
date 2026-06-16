'use client'

import { useAnalyticsEvent } from '@/hooks/useAnalyticsEvent'
import { toMetaCustomDataFromProduct } from '@/lib/analytics/meta/productContent'
import { useRecentlyViewed } from '@/providers/RecentlyViewed'
import { useEffect, useRef } from 'react'

export type ProductViewBeaconProps = {
  productId: number
  slug?: string | null
  title?: string | null
  category?: string | null
  price?: number | null
  currency?: string
}

export function ProductViewBeacon({
  productId,
  slug,
  title,
  category,
  price,
  currency = 'BDT',
}: ProductViewBeaconProps) {
  const { trackEvent } = useAnalyticsEvent()
  const { recordView } = useRecentlyViewed()
  const tracked = useRef(false)

  useEffect(() => {
    if (tracked.current) return
    tracked.current = true
    recordView(productId)
    void trackEvent({
      customData: toMetaCustomDataFromProduct({
        category,
        currency,
        id: productId,
        price,
        slug,
        title,
      }),
      eventType: 'product_view',
      productId,
    })
  }, [category, currency, price, productId, recordView, slug, title, trackEvent])

  return null
}
