/**
 * GA4 Measurement Protocol — server-side purchase event.
 * @see https://developers.google.com/analytics/devguides/collection/protocol/ga4
 */

export type Ga4PurchaseItem = {
  item_id: string
  item_name: string
  price?: number
  quantity: number
}

export async function sendGa4Purchase(args: {
  measurementId: string
  apiSecret: string
  clientId: string
  transactionId: string
  value: number
  currency: string
  items: Ga4PurchaseItem[]
  eventId: string
}): Promise<void> {
  const {
    measurementId,
    apiSecret,
    clientId,
    transactionId,
    value,
    currency,
    items,
    eventId,
  } = args

  const url = `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`

  const body = {
    client_id: clientId,
    events: [
      {
        name: 'purchase',
        params: {
          transaction_id: transactionId,
          value,
          currency,
          items,
          engagement_time_msec: 1,
          event_id: eventId,
        },
      },
    ],
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    console.warn('[analytics] GA4 purchase mp/collect failed', res.status)
  }
}
