'use client'

import { trackGa4Event } from '@/lib/analytics/gtag'
import { createPurchaseEventId } from '@/lib/analytics/meta/eventId'
import { getMetaExternalId, readMetaCookies } from '@/lib/analytics/meta/cookies'
import { trackMetaPixelEvent } from '@/lib/analytics/meta/client'
import { getClientSideURL } from '@/utilities/getURL'
import { useEffect, useRef } from 'react'

export type PurchaseEventBeaconProps = {
  orderId: string
  guestAccessToken?: string
  currency?: string
  value?: number
}

/**
 * Sends deduplicated Purchase to Meta Pixel (browser) + GA4/Meta CAPI (server).
 * Uses a shared `event_id` so Meta deduplicates browser and server events.
 */
export function PurchaseEventBeacon({
  orderId,
  guestAccessToken = '',
  currency = 'BDT',
  value,
}: PurchaseEventBeaconProps) {
  const sent = useRef(false)

  useEffect(() => {
    if (!orderId || sent.current) return
    const storageKey = `purchase_tracked_${orderId}`
    try {
      if (sessionStorage.getItem(storageKey)) return
    } catch {
      /* ignore */
    }

    sent.current = true
    const clientId = getMetaExternalId()
    const eventId = createPurchaseEventId(orderId)
    const { fbp, fbc } = readMetaCookies()

    const purchaseCustomData = {
      content_type: 'product' as const,
      currency,
      order_id: orderId,
      ...(typeof value === 'number' ? { value } : {}),
    }

    trackMetaPixelEvent({
      customData: purchaseCustomData,
      eventId,
      eventName: 'Purchase',
    })

    trackGa4Event('purchase', purchaseCustomData)

    const base = getClientSideURL()
    void fetch(`${base}/api/analytics/purchase`, {
      body: JSON.stringify({
        accessToken: guestAccessToken || undefined,
        clientId,
        eventId,
        eventSourceUrl: window.location.href,
        fbc: fbc || undefined,
        fbp: fbp || undefined,
        orderId,
      }),
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    })
      .then((res) => {
        if (res.ok) {
          try {
            sessionStorage.setItem(storageKey, '1')
          } catch {
            /* ignore */
          }
        }
      })
      .catch(() => {
        sent.current = false
      })
  }, [currency, guestAccessToken, orderId, value])

  return null
}
