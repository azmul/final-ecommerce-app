'use client'

import { useAnalyticsEvent } from '@/hooks/useAnalyticsEvent'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { useEffect, useRef } from 'react'

export function CheckoutBeginBeacon() {
  const { trackEvent } = useAnalyticsEvent()
  const { cart } = useCart()
  const tracked = useRef(false)

  useEffect(() => {
    if (tracked.current || !cart?.id) return
    tracked.current = true
    void trackEvent({
      cartId: cart.id,
      eventType: 'begin_checkout',
      metadata: {
        itemCount: cart.items?.length ?? 0,
        subtotal: cart.subtotal,
      },
    })
  }, [cart?.id, cart?.items?.length, cart?.subtotal, trackEvent])

  return null
}
