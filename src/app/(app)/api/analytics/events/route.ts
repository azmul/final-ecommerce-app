import { logAnalyticsEvent, type AnalyticsEventType } from '@/lib/analytics/logAnalyticsEvent'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const ALLOWED_EVENTS = new Set<AnalyticsEventType>([
  'product_view',
  'add_to_cart',
  'begin_checkout',
  'purchase',
])

export async function POST(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const auth = await payload.auth({ headers: request.headers })

  let body: Record<string, unknown> = {}
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  const eventType = body.eventType
  if (typeof eventType !== 'string' || !ALLOWED_EVENTS.has(eventType as AnalyticsEventType)) {
    return NextResponse.json({ error: 'Invalid event type.' }, { status: 400 })
  }

  const sessionId = typeof body.sessionId === 'string' ? body.sessionId.trim() : ''
  if (!sessionId || sessionId.length > 128) {
    return NextResponse.json({ error: 'Session id is required.' }, { status: 400 })
  }

  const productId = Number(body.productId)
  const cartId = Number(body.cartId)
  const orderId = Number(body.orderId)

  await logAnalyticsEvent(payload, {
    cartId: Number.isFinite(cartId) ? cartId : undefined,
    eventType: eventType as AnalyticsEventType,
    metadata:
      body.metadata && typeof body.metadata === 'object' ?
        (body.metadata as Record<string, unknown>)
      : undefined,
    orderId: Number.isFinite(orderId) ? orderId : undefined,
    productId: Number.isFinite(productId) ? productId : undefined,
    sessionId,
    userId: auth.user?.id,
  })

  return NextResponse.json({ ok: true })
}
