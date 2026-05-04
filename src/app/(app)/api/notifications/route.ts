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

  const url = new URL(request.url)
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit')) || 30, 1), 100)
  const unreadOnly = url.searchParams.get('unread') === '1'

  const result = await payload.find({
    collection: 'user-notifications',
    depth: 0,
    limit,
    overrideAccess: false,
    pagination: false,
    sort: '-createdAt',
    user,
    ...(unreadOnly
      ? {
          where: {
            or: [{ readAt: { equals: null } }, { readAt: { exists: false } }],
          },
        }
      : {}),
  })

  const unread = await payload.find({
    collection: 'user-notifications',
    depth: 0,
    limit: 0,
    overrideAccess: false,
    pagination: false,
    user,
    where: {
      or: [{ readAt: { equals: null } }, { readAt: { exists: false } }],
    },
  })

  return NextResponse.json({
    docs: result.docs,
    totalDocs: result.totalDocs,
    unreadCount: unread.totalDocs,
  })
}

export async function PATCH(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: request.headers })

  if (!user) {
    return jsonError('Authentication is required.', 401)
  }

  const body = (await request.json().catch(() => null)) as
    | { markAllRead?: boolean; ids?: number[] }
    | null

  if (!body) {
    return jsonError('Invalid JSON body.', 400)
  }

  const now = new Date().toISOString()

  if (body.markAllRead) {
    const open = await payload.find({
      collection: 'user-notifications',
      depth: 0,
      limit: 500,
      overrideAccess: false,
      pagination: false,
      user,
      where: {
        or: [{ readAt: { equals: null } }, { readAt: { exists: false } }],
      },
    })

    for (const doc of open.docs) {
      await payload.update({
        collection: 'user-notifications',
        data: { readAt: now },
        id: doc.id,
        overrideAccess: false,
        user,
      })
    }

    return NextResponse.json({ ok: true, updated: open.docs.length })
  }

  if (!Array.isArray(body.ids) || body.ids.length === 0) {
    return jsonError('ids array is required unless markAllRead is true.', 400)
  }

  let updated = 0
  for (const id of body.ids) {
    await payload.update({
      collection: 'user-notifications',
      data: { readAt: now },
      id,
      overrideAccess: false,
      user,
    })
    updated++
  }

  return NextResponse.json({ ok: true, updated })
}
