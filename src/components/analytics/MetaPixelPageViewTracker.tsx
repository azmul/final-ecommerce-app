'use client'

import { createPageViewEventId } from '@/lib/analytics/meta/eventId'
import { trackMetaPixelEvent, waitForMetaPixel } from '@/lib/analytics/meta/client'
import { getMetaExternalId, readMetaCookies } from '@/lib/analytics/meta/cookies'
import { logMetaDebug } from '@/lib/analytics/meta/debug'
import { getClientSideURL } from '@/utilities/getURL'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useRef } from 'react'

function buildPagePath(pathname: string, searchParams: URLSearchParams | null): string {
  const query = searchParams?.toString()
  return query ? `${pathname}?${query}` : pathname
}

/**
 * Tracks Meta PageView on initial load and client-side route transitions.
 * Initial HTML load does not auto-fire PageView — this component owns all page views
 * to avoid duplicate events during hydration.
 */
export function MetaPixelPageViewTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const lastTrackedPath = useRef<string | null>(null)

  useEffect(() => {
    const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim()
    if (!pixelId) return

    const pagePath = buildPagePath(pathname, searchParams)
    if (lastTrackedPath.current === pagePath) return
    lastTrackedPath.current = pagePath

    const eventId = createPageViewEventId(pagePath)

    void (async () => {
      const ready = await waitForMetaPixel()
      if (!ready) {
        logMetaDebug('pageview', 'Pixel not ready', { pagePath })
        lastTrackedPath.current = null
        return
      }

      const tracked = trackMetaPixelEvent({
        eventId,
        eventName: 'PageView',
      })

      if (!tracked) {
        lastTrackedPath.current = null
        return
      }

      const { fbp, fbc } = readMetaCookies()
      const externalId = getMetaExternalId()

      void fetch(`${getClientSideURL()}/api/analytics/meta`, {
        body: JSON.stringify({
          eventId,
          eventName: 'PageView',
          eventSourceUrl: window.location.href,
          externalId,
          fbc,
          fbp,
        }),
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      }).catch(() => {
        logMetaDebug('pageview', 'CAPI relay failed', { pagePath })
      })
    })()
  }, [pathname, searchParams])

  return null
}
