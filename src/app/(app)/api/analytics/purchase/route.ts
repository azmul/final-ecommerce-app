import configPromise from '@payload-config'
import type { Order } from '@/payload-types'
import { logAnalyticsEvent } from '@/lib/analytics/logAnalyticsEvent'
import { sendServerPurchaseAttribution } from '@/lib/analytics/sendServerPurchaseAttribution'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

export const runtime = 'nodejs'

type Body = {
  orderId?: string
  accessToken?: string
  clientId?: string
  fbp?: string
  fbc?: string
  eventId?: string
  eventSourceUrl?: string
}

async function loadAuthorizedOrder(args: {
  orderId: string
  accessToken: string
  userId?: number | string
}): Promise<Order | null> {
  const { orderId, accessToken, userId } = args
  const payload = await getPayload({ config: configPromise })

  try {
    const {
      docs: [orderResult],
    } = await payload.find({
      collection: 'orders',
      depth: 2,
      overrideAccess: !Boolean(userId),
      where: {
        and: [
          { id: { equals: orderId } },
          ...(userId
            ? [{ customer: { equals: userId } }]
            : [{ accessToken: { equals: accessToken } }]),
        ],
      },
      limit: 1,
      pagination: false,
    })

    const canGuest =
      Boolean(accessToken) &&
      orderResult &&
      typeof orderResult.accessToken === 'string' &&
      orderResult.accessToken === accessToken

    const canUser =
      userId &&
      orderResult &&
      orderResult.customer &&
      (typeof orderResult.customer === 'object' ?
        orderResult.customer.id === userId
      : orderResult.customer === userId)

    if (orderResult && (canGuest || canUser)) {
      return orderResult as Order
    }
  } catch {
    /* deny */
  }

  return null
}

export async function POST(req: Request): Promise<Response> {
  let json: Body
  try {
    json = (await req.json()) as Body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const orderId = typeof json.orderId === 'string' ? json.orderId.trim() : ''
  const accessToken = typeof json.accessToken === 'string' ? json.accessToken.trim() : ''
  const clientId = typeof json.clientId === 'string' ? json.clientId.trim() : ''

  if (!orderId || !clientId) {
    return NextResponse.json({ error: 'orderId and clientId required' }, { status: 400 })
  }

  const hdrs = await headers()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: hdrs })

  if (!user && !accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const order = await loadAuthorizedOrder({
    accessToken,
    orderId,
    userId: user?.id,
  })

  if (!order) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const clientIp =
    hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() || hdrs.get('x-real-ip') || null
  const clientUserAgent = hdrs.get('user-agent')

  await Promise.all([
    sendServerPurchaseAttribution({
      clientId,
      clientIp,
      clientUserAgent,
      eventId: typeof json.eventId === 'string' ? json.eventId.trim() : undefined,
      eventSourceUrl:
        typeof json.eventSourceUrl === 'string' ? json.eventSourceUrl.trim() : undefined,
      fbc: json.fbc ?? null,
      fbp: json.fbp ?? null,
      order,
    }),
    logAnalyticsEvent(
      payload,
      {
        eventType: 'purchase',
        metadata: {
          amount: order.amount,
          clientId,
          currency: order.currency,
        },
        orderId: order.id,
        sessionId: clientId,
        userId: user?.id,
      },
    ),
  ])

  return NextResponse.json({ ok: true })
}
