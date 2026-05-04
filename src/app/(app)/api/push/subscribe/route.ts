import configPromise from '@payload-config'
import type { PushSubscription } from 'web-push'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

type NativeBody = {
  platform: 'native'
  fcmToken: string
  userAgent?: string
}

type WebBody = {
  platform?: 'web' | 'mobile_web'
  subscription: PushSubscription
  userAgent?: string
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export async function POST(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: request.headers })

  if (!user) {
    return jsonError('Authentication is required.', 401)
  }

  const body = (await request.json().catch(() => null)) as WebBody | NativeBody | null

  if (!body) {
    return jsonError('Invalid JSON body.', 400)
  }

  if ('platform' in body && body.platform === 'native') {
    if (!body.fcmToken?.trim()) {
      return jsonError('fcmToken is required for native subscriptions.', 400)
    }

    const endpoint = `fcm:${body.fcmToken.trim()}`

    const dupes = await payload.find({
      collection: 'push-subscriptions',
      depth: 0,
      limit: 100,
      overrideAccess: true,
      where: {
        endpoint: {
          equals: endpoint,
        },
      },
    })

    for (const row of dupes.docs) {
      await payload.delete({
        collection: 'push-subscriptions',
        id: row.id,
        overrideAccess: true,
      })
    }

    await payload.create({
      collection: 'push-subscriptions',
      data: {
        auth: 'native-placeholder',
        endpoint,
        p256dh: 'native-placeholder',
        platform: 'native',
        user: user.id,
        userAgent: typeof body.userAgent === 'string' ? body.userAgent : undefined,
      },
      overrideAccess: false,
      user,
    })

    return NextResponse.json({ ok: true })
  }

  const web = body as WebBody
  const sub = web.subscription
  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
    return jsonError('A full push subscription object is required.', 400)
  }

  const dupes = await payload.find({
    collection: 'push-subscriptions',
    depth: 0,
    limit: 100,
    overrideAccess: true,
    where: {
      endpoint: {
        equals: sub.endpoint,
      },
    },
  })

  for (const row of dupes.docs) {
    await payload.delete({
      collection: 'push-subscriptions',
      id: row.id,
      overrideAccess: true,
    })
  }

  await payload.create({
    collection: 'push-subscriptions',
    data: {
      auth: sub.keys.auth,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      platform: web.platform === 'mobile_web' ? 'mobile_web' : 'web',
      user: user.id,
      userAgent: typeof web.userAgent === 'string' ? web.userAgent : undefined,
    },
    overrideAccess: false,
    user,
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: request.headers })

  if (!user) {
    return jsonError('Authentication is required.', 401)
  }

  const url = new URL(request.url)
  const endpoint = url.searchParams.get('endpoint')
  if (!endpoint) {
    return jsonError('endpoint query parameter is required.', 400)
  }

  const found = await payload.find({
    collection: 'push-subscriptions',
    depth: 0,
    limit: 10,
    overrideAccess: false,
    user,
    where: {
      and: [{ endpoint: { equals: endpoint } }, { user: { equals: user.id } }],
    },
  })

  for (const row of found.docs) {
    await payload.delete({
      collection: 'push-subscriptions',
      id: row.id,
      overrideAccess: false,
      user,
    })
  }

  return NextResponse.json({ ok: true })
}
