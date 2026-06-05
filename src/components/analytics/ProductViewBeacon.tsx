'use client'

import { useAnalyticsEvent } from '@/hooks/useAnalyticsEvent'
import { useRecentlyViewed } from '@/providers/RecentlyViewed'
import { useEffect, useRef } from 'react'

export function ProductViewBeacon({ productId }: { productId: number }) {
  const { trackEvent } = useAnalyticsEvent()
  const { recordView } = useRecentlyViewed()
  const tracked = useRef(false)

  useEffect(() => {
    if (tracked.current) return
    tracked.current = true
    recordView(productId)
    void trackEvent({
      eventType: 'product_view',
      productId,
    })
  }, [productId, recordView, trackEvent])

  return null
}
