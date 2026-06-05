'use client'

import { getAnalyticsSessionId } from '@/utilities/analyticsSession'
import { useCallback } from 'react'

type AnalyticsEventPayload = {
  cartId?: number
  eventType: 'product_view' | 'add_to_cart' | 'begin_checkout' | 'purchase'
  metadata?: Record<string, unknown>
  orderId?: number
  productId?: number
}

export function useAnalyticsEvent() {
  const trackEvent = useCallback(async (payload: AnalyticsEventPayload) => {
    const sessionId = getAnalyticsSessionId()
    if (!sessionId) return

    try {
      await fetch('/api/analytics/events', {
        body: JSON.stringify({
          ...payload,
          sessionId,
        }),
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
    } catch {
      // Analytics should never block UX.
    }
  }, [])

  return { trackEvent }
}
