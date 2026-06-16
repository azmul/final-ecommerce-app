'use client'

import { getMetaExternalId, readMetaCookies } from '@/lib/analytics/meta/cookies'
import { trackMetaPixelEvent, waitForMetaPixel } from '@/lib/analytics/meta/client'
import { createStoreEventId } from '@/lib/analytics/meta/eventId'
import { logMetaDebug } from '@/lib/analytics/meta/debug'
import {
  STORE_EVENT_TO_META,
  type MetaCustomData,
  type StoreAnalyticsEventType,
} from '@/lib/analytics/meta/types'
import { getClientSideURL } from '@/utilities/getURL'
import { getAnalyticsSessionId } from '@/utilities/analyticsSession'

export type TrackStoreEventInput = {
  eventType: StoreAnalyticsEventType
  eventId?: string
  subjectId?: string | number
  customData?: MetaCustomData
  email?: string
  phone?: string
  skipServer?: boolean
}

export async function trackStoreEvent(input: TrackStoreEventInput): Promise<string | null> {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim()
  if (!pixelId) return null

  const eventId = input.eventId ?? createStoreEventId(input.eventType, input.subjectId)
  const metaEventName = STORE_EVENT_TO_META[input.eventType]
  const customData = input.customData

  const ready = await waitForMetaPixel()
  if (ready) {
    trackMetaPixelEvent({
      customData,
      eventId,
      eventName: metaEventName,
    })
  }

  if (input.skipServer) return eventId

  const { fbp, fbc } = readMetaCookies()
  const externalId = getMetaExternalId()
  const sessionId = getAnalyticsSessionId()

  try {
    const res = await fetch(`${getClientSideURL()}/api/analytics/meta`, {
      body: JSON.stringify({
        customData,
        email: input.email,
        eventId,
        eventName: metaEventName,
        eventSourceUrl: typeof window !== 'undefined' ? window.location.href : undefined,
        externalId,
        fbc,
        fbp,
        phone: input.phone,
        sessionId,
      }),
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    })

    if (!res.ok) {
      logMetaDebug('track', 'Server relay failed', { eventName: metaEventName, status: res.status })
    }
  } catch {
    logMetaDebug('track', 'Server relay network error', { eventName: metaEventName })
  }

  return eventId
}
