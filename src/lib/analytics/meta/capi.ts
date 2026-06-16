import { buildMetaCapiUserData } from '@/lib/analytics/meta/userData'
import { logMetaDebug } from '@/lib/analytics/meta/debug'
import type { MetaCapiEventInput } from '@/lib/analytics/meta/types'

const GRAPH_VERSION = 'v21.0'
const MAX_RETRIES = 3
const RETRY_BASE_MS = 400

type SendMetaCapiOptions = {
  pixelId: string
  accessToken: string
  testEventCode?: string
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function shouldRetry(status: number): boolean {
  return status === 429 || status >= 500
}

export function buildMetaCapiPayload(
  events: MetaCapiEventInput[],
  testEventCode?: string,
): Record<string, unknown> {
  const data = events.map((event) => {
    const userData = buildMetaCapiUserData(event.userData ?? {})
    const customData = event.customData ?? {}

    return {
      action_source: 'website',
      custom_data: customData,
      event_id: event.eventId,
      event_name: event.eventName,
      event_time: event.eventTimeSeconds ?? Math.floor(Date.now() / 1000),
      ...(event.eventSourceUrl ? { event_source_url: event.eventSourceUrl } : {}),
      user_data: userData,
    }
  })

  return {
    data,
    ...(testEventCode ? { test_event_code: testEventCode } : {}),
  }
}

export async function sendMetaCapiEvents(
  options: SendMetaCapiOptions,
  events: MetaCapiEventInput[],
): Promise<{ ok: boolean; status?: number; error?: string }> {
  if (!events.length) return { ok: true }

  const { pixelId, accessToken, testEventCode } = options
  const payload = buildMetaCapiPayload(events, testEventCode)
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${encodeURIComponent(pixelId)}/events?access_token=${encodeURIComponent(accessToken)}`

  logMetaDebug('capi', 'Sending events', {
    count: events.length,
    eventNames: events.map((event) => event.eventName),
    testEventCode: testEventCode ?? null,
  })

  let lastStatus: number | undefined
  let lastError = ''

  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    try {
      const res = await fetch(url, {
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })

      lastStatus = res.status

      if (res.ok) {
        logMetaDebug('capi', 'Events accepted', { status: res.status })
        return { ok: true, status: res.status }
      }

      lastError = await res.text().catch(() => '')
      logMetaDebug('capi', 'Events rejected', {
        attempt: attempt + 1,
        status: res.status,
        body: lastError.slice(0, 300),
      })

      if (!shouldRetry(res.status) || attempt === MAX_RETRIES - 1) {
        console.warn('[analytics] Meta CAPI failed', res.status, lastError.slice(0, 200))
        return { ok: false, error: lastError, status: res.status }
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Network error'
      logMetaDebug('capi', 'Network error', { attempt: attempt + 1, error: lastError })

      if (attempt === MAX_RETRIES - 1) {
        console.warn('[analytics] Meta CAPI network error', lastError)
        return { ok: false, error: lastError }
      }
    }

    await sleep(RETRY_BASE_MS * 2 ** attempt)
  }

  return { ok: false, error: lastError, status: lastStatus }
}

export async function sendMetaCapiEvent(
  options: SendMetaCapiOptions,
  event: MetaCapiEventInput,
): Promise<{ ok: boolean; status?: number; error?: string }> {
  return sendMetaCapiEvents(options, [event])
}
