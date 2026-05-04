/**
 * Meta Conversions API — Purchase event (server-side).
 * @see https://developers.facebook.com/docs/marketing-api/conversions-api/using-the-api
 */

import { metaHashEmail, metaHashPhone } from '@/lib/analytics/metaHash'

const GRAPH_VERSION = 'v21.0'

export type MetaPurchaseContent = {
  id: string
  quantity: number
  item_price?: number
}

export async function sendMetaPurchase(args: {
  pixelId: string
  accessToken: string
  eventId: string
  eventTimeSeconds: number
  currency: string
  value: number
  contents: MetaPurchaseContent[]
  orderId: string
  email?: string | null
  phone?: string | null
  clientIp?: string | null
  clientUserAgent?: string | null
  fbp?: string | null
  fbc?: string | null
}): Promise<void> {
  const {
    pixelId,
    accessToken,
    eventId,
    eventTimeSeconds,
    currency,
    value,
    contents,
    orderId,
    email,
    phone,
    clientIp,
    clientUserAgent,
    fbp,
    fbc,
  } = args

  const user_data: Record<string, unknown> = {}
  if (email) {
    const hashed = metaHashEmail(email)
    if (hashed) user_data.em = [hashed]
  }
  if (phone) {
    const hashed = metaHashPhone(phone)
    if (hashed) user_data.ph = [hashed]
  }
  if (clientIp) user_data.client_ip_address = clientIp
  if (clientUserAgent) user_data.client_user_agent = clientUserAgent
  if (fbp) user_data.fbp = fbp
  if (fbc) user_data.fbc = fbc

  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${encodeURIComponent(pixelId)}/events?access_token=${encodeURIComponent(accessToken)}`

  const payload = {
    data: [
      {
        event_name: 'Purchase',
        event_time: eventTimeSeconds,
        action_source: 'website',
        event_id: eventId,
        user_data,
        custom_data: {
          currency,
          value,
          content_type: 'product',
          contents,
          order_id: String(orderId),
        },
      },
    ],
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    console.warn('[analytics] Meta CAPI Purchase failed', res.status, text.slice(0, 200))
  }
}
