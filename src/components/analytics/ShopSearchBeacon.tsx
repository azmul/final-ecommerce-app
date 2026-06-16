'use client'

import { useAnalyticsEvent } from '@/hooks/useAnalyticsEvent'
import { useEffect, useRef } from 'react'

export function ShopSearchBeacon({ searchValue }: { searchValue?: string }) {
  const { trackEvent } = useAnalyticsEvent()
  const lastTracked = useRef<string | null>(null)

  useEffect(() => {
    const query = searchValue?.trim()
    if (!query || query.length < 2) return
    if (lastTracked.current === query) return
    lastTracked.current = query

    void trackEvent({
      customData: {
        search_string: query,
      },
      eventType: 'search',
      metadata: { query },
      subjectId: query,
    })
  }, [searchValue, trackEvent])

  return null
}
