/**
 * Meta Conversions API — Purchase event (server-side).
 * @see https://developers.facebook.com/docs/marketing-api/conversions-api/using-the-api
 */

import { sendMetaCapiEvent } from '@/lib/analytics/meta/capi'
import { getMetaServerConfig } from '@/lib/analytics/meta/config'
import type { MetaContentItem } from '@/lib/analytics/meta/types'

export type MetaPurchaseContent = MetaContentItem

export async function sendMetaPurchase(args: {
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
  externalId?: string | null
  eventSourceUrl?: string | null
}): Promise<void> {
  const config = getMetaServerConfig()
  if (!config) return

  const {
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
    externalId,
    eventSourceUrl,
  } = args

  await sendMetaCapiEvent(config, {
    customData: {
      content_type: 'product',
      contents,
      currency,
      order_id: String(orderId),
      value,
    },
    eventId,
    eventName: 'Purchase',
    eventSourceUrl: eventSourceUrl ?? undefined,
    eventTimeSeconds,
    userData: {
      clientIp,
      clientUserAgent,
      email,
      externalId,
      fbc,
      fbp,
      phone,
    },
  })
}
