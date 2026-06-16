'use client'

import { trackStoreEvent } from '@/lib/analytics/trackStoreEvent'
import type { MetaCustomData } from '@/lib/analytics/meta/types'
import { getAnalyticsSessionId } from '@/utilities/analyticsSession'
import { useCallback } from 'react'

export type AnalyticsEventType =
  | 'product_view'
  | 'add_to_cart'
  | 'begin_checkout'
  | 'add_payment_info'
  | 'purchase'
  | 'search'
  | 'lead'
  | 'complete_registration'

type AnalyticsEventPayload = {
  cartId?: number
  eventType: AnalyticsEventType
  metadata?: Record<string, unknown>
  orderId?: number
  productId?: number
  customData?: MetaCustomData
  email?: string
  phone?: string
  eventId?: string
  subjectId?: string | number
}

export function useAnalyticsEvent() {
  const trackEvent = useCallback(async (payload: AnalyticsEventPayload) => {
    const sessionId = getAnalyticsSessionId()
    if (!sessionId) return

    const subjectId =
      payload.subjectId ??
      payload.orderId ??
      payload.productId ??
      payload.cartId

    void trackStoreEvent({
      customData: payload.customData,
      email: payload.email,
      eventId: payload.eventId,
      eventType: payload.eventType,
      phone: payload.phone,
      subjectId,
    })

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
