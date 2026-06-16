'use client'

import { logMetaDebug } from '@/lib/analytics/meta/debug'
import type { MetaClientTrackInput, MetaCustomData } from '@/lib/analytics/meta/types'

type FbqFn = (
  command: 'track' | 'trackCustom' | 'init',
  eventName: string,
  params?: Record<string, unknown>,
  options?: { eventID?: string },
) => void

declare global {
  interface Window {
    fbq?: FbqFn
    _fbq?: FbqFn
  }
}

const META_STANDARD_EVENT_SET = new Set([
  'PageView',
  'ViewContent',
  'Search',
  'AddToCart',
  'InitiateCheckout',
  'AddPaymentInfo',
  'Purchase',
  'Lead',
  'CompleteRegistration',
])

export function isMetaPixelLoaded(): boolean {
  return typeof window !== 'undefined' && typeof window.fbq === 'function'
}

const FBQ_WAIT_MS = 4000
const FBQ_POLL_MS = 100

export function waitForMetaPixel(timeoutMs = FBQ_WAIT_MS): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false)
  if (isMetaPixelLoaded()) return Promise.resolve(true)

  return new Promise((resolve) => {
    const started = Date.now()

    const tick = () => {
      if (isMetaPixelLoaded()) {
        resolve(true)
        return
      }

      if (Date.now() - started >= timeoutMs) {
        resolve(false)
        return
      }

      window.setTimeout(tick, FBQ_POLL_MS)
    }

    tick()
  })
}

export function trackMetaPixelEvent(input: MetaClientTrackInput): boolean {
  if (!isMetaPixelLoaded() || !window.fbq) return false

  const { eventName, eventId, customData } = input
  const params = customData ? flattenMetaCustomData(customData) : undefined
  const options = { eventID: eventId }

  if (META_STANDARD_EVENT_SET.has(eventName)) {
    window.fbq('track', eventName, params, options)
  } else {
    window.fbq('trackCustom', eventName, params, options)
  }

  logMetaDebug('pixel', `Tracked ${eventName}`, { eventId, params })
  return true
}

function flattenMetaCustomData(customData: MetaCustomData): Record<string, unknown> {
  return {
    ...(customData.content_ids ? { content_ids: customData.content_ids } : {}),
    ...(customData.content_name ? { content_name: customData.content_name } : {}),
    ...(customData.content_category ? { content_category: customData.content_category } : {}),
    ...(customData.content_type ? { content_type: customData.content_type } : {}),
    ...(customData.contents ? { contents: customData.contents } : {}),
    ...(customData.currency ? { currency: customData.currency } : {}),
    ...(typeof customData.value === 'number' ? { value: customData.value } : {}),
    ...(customData.search_string ? { search_string: customData.search_string } : {}),
    ...(customData.order_id ? { order_id: customData.order_id } : {}),
    ...(typeof customData.num_items === 'number' ? { num_items: customData.num_items } : {}),
  }
}
