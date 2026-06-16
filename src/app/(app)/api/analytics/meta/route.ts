import { sendMetaCapiEvent } from '@/lib/analytics/meta/capi'
import { getMetaServerConfig } from '@/lib/analytics/meta/config'
import { logMetaDebug } from '@/lib/analytics/meta/debug'
import type { MetaCustomData } from '@/lib/analytics/meta/types'
import configPromise from '@payload-config'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Body = {
  eventName?: string
  eventId?: string
  eventSourceUrl?: string
  customData?: MetaCustomData
  email?: string
  phone?: string
  externalId?: string
  fbp?: string
  fbc?: string
  sessionId?: string
}

export async function POST(request: Request): Promise<Response> {
  const config = getMetaServerConfig()
  if (!config) {
    return NextResponse.json({ ok: true, skipped: 'meta_not_configured' })
  }

  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  const eventName = typeof body.eventName === 'string' ? body.eventName.trim() : ''
  const eventId = typeof body.eventId === 'string' ? body.eventId.trim() : ''

  if (!eventName || !eventId || eventId.length > 128) {
    return NextResponse.json({ error: 'eventName and eventId are required.' }, { status: 400 })
  }

  const hdrs = await headers()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: hdrs })

  const clientIp =
    hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() || hdrs.get('x-real-ip') || null
  const clientUserAgent = hdrs.get('user-agent')

  const email =
    typeof body.email === 'string' && body.email.trim() ?
      body.email.trim().toLowerCase()
    : user?.email && typeof user.email === 'string' ?
      user.email.trim().toLowerCase()
    : null

  const phone =
    typeof body.phone === 'string' && body.phone.trim() ? body.phone.trim()
    : user && 'phone' in user && typeof user.phone === 'string' ? user.phone.trim()
    : null

  const externalId =
    user?.id != null ? String(user.id)
    : typeof body.externalId === 'string' && body.externalId.trim() ? body.externalId.trim()
    : typeof body.sessionId === 'string' && body.sessionId.trim() ? body.sessionId.trim()
    : null

  const result = await sendMetaCapiEvent(config, {
    customData: body.customData,
    eventId,
    eventName,
    eventSourceUrl:
      typeof body.eventSourceUrl === 'string' ? body.eventSourceUrl : undefined,
    userData: {
      clientIp,
      clientUserAgent,
      email,
      externalId,
      fbc: typeof body.fbc === 'string' ? body.fbc : null,
      fbp: typeof body.fbp === 'string' ? body.fbp : null,
      phone,
    },
  })

  logMetaDebug('api', 'Relay result', {
    eventId,
    eventName,
    ok: result.ok,
    status: result.status,
  })

  if (!result.ok) {
    return NextResponse.json(
      { error: 'Meta CAPI relay failed.', status: result.status },
      { status: 502 },
    )
  }

  return NextResponse.json({ ok: true })
}
