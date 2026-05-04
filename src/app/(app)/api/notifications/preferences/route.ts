import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

import { ensureNotificationPreferences } from '@/lib/notifications/ensureNotificationPreferences'

export const dynamic = 'force-dynamic'

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export async function GET(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: request.headers })

  if (!user) {
    return jsonError('Authentication is required.', 401)
  }

  await ensureNotificationPreferences(payload, user.id)

  const prefs = await payload.find({
    collection: 'notification-preferences',
    depth: 0,
    limit: 1,
    overrideAccess: false,
    user,
    where: {
      user: {
        equals: user.id,
      },
    },
  })

  return NextResponse.json({ doc: prefs.docs[0] ?? null })
}

export async function PATCH(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: request.headers })

  if (!user) {
    return jsonError('Authentication is required.', 401)
  }

  await ensureNotificationPreferences(payload, user.id)

  const existing = await payload.find({
    collection: 'notification-preferences',
    depth: 0,
    limit: 1,
    overrideAccess: false,
    user,
    where: {
      user: {
        equals: user.id,
      },
    },
  })

  const doc = existing.docs[0]
  if (!doc) {
    return jsonError('Preferences not found.', 404)
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  if (!body) {
    return jsonError('Invalid JSON body.', 400)
  }

  const data: Record<string, unknown> = {}
  const boolKeys = [
    'pushEnabled',
    'priceDropAlerts',
    'stockAlerts',
    'orderUpdates',
    'marketingOptIn',
  ] as const

  for (const key of boolKeys) {
    if (typeof body[key] === 'boolean') {
      data[key] = body[key]
    }
  }

  const updated = await payload.update({
    id: doc.id,
    collection: 'notification-preferences',
    data,
    depth: 0,
    overrideAccess: false,
    user,
  })

  return NextResponse.json({ doc: updated })
}
