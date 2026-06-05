'use client'

import { getClientSideURL } from '@/utilities/getURL'
import { randomUUID } from '@/utilities/randomUUID'
import { useEffect, useRef } from 'react'

function analyticsClientId(): string {
  if (typeof window === 'undefined') return ''
  const key = 'analytics_client_id'
  try {
    let id = window.localStorage.getItem(key)
    if (!id) {
      id = randomUUID()
      window.localStorage.setItem(key, id)
    }
    return id
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`
  }
}

function metaCookies(): { fbp?: string; fbc?: string } {
  if (typeof document === 'undefined') return {}
  const read = (name: string) => {
    const hit = document.cookie.split('; ').find((row) => row.startsWith(`${name}=`))
    return hit?.split('=').slice(1).join('=')
  }
  const fbp = read('_fbp')
  const fbc = read('_fbc')
  return { ...(fbp ? { fbp } : {}), ...(fbc ? { fbc } : {}) }
}

export type PurchaseEventBeaconProps = {
  orderId: string
  guestAccessToken?: string
}

/**
 * Sends one server-side Purchase to GA4 (Measurement Protocol) + Meta CAPI when env is configured.
 * Deduped per tab via sessionStorage so refreshes do not re-fire.
 */
export function PurchaseEventBeacon({ orderId, guestAccessToken = '' }: PurchaseEventBeaconProps) {
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
    const clientId = analyticsClientId()
    const { fbp, fbc } = metaCookies()

    const base = getClientSideURL()
    void fetch(`${base}/api/analytics/purchase`, {
      body: JSON.stringify({
        accessToken: guestAccessToken || undefined,
        clientId,
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
  }, [guestAccessToken, orderId])

  return null
}
