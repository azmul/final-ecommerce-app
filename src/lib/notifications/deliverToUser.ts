import type { Payload, PayloadRequest, Where } from 'payload'
import webpush from 'web-push'

import { getServerSideURL } from '@/utilities/getURL'

export type NotificationKind = 'price_drop' | 'restock' | 'broadcast' | 'system'

export type DeliverResult =
  | { delivered: false; reason: 'duplicate' | 'duplicate_broadcast' | 'category_disabled' }
  | { delivered: true; channels: ('inbox' | 'push')[] }

type DeliverArgs = {
  payload: Payload
  req?: PayloadRequest
  userId: number
  title: string
  body: string
  linkUrl?: string | null
  kind: NotificationKind
  productId?: number | null
  broadcastId?: number | null
  /** Required when kind is broadcast; controls push eligibility vs marketing opt-in. */
  broadcastSegment?: 'push_enabled' | 'marketing_opt_in'
  /** When set, duplicate detection keys off this product id (defaults to productId). */
  dedupeProductId?: number | null
  skipPush?: boolean
}

async function getPrefs(payload: Payload, userId: number, req?: PayloadRequest) {
  const res = await payload.find({
    collection: 'notification-preferences',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    ...(req ? { req } : {}),
    where: {
      user: {
        equals: userId,
      },
    },
  })

  const row = res.docs[0] as
    | {
        pushEnabled?: boolean | null
        priceDropAlerts?: boolean | null
        stockAlerts?: boolean | null
        marketingOptIn?: boolean | null
        orderUpdates?: boolean | null
      }
    | undefined

  if (!row) {
    return {
      pushEnabled: true,
      priceDropAlerts: true,
      stockAlerts: true,
      marketingOptIn: false,
      orderUpdates: true,
    }
  }

  return {
    pushEnabled: row.pushEnabled !== false,
    priceDropAlerts: row.priceDropAlerts !== false,
    stockAlerts: row.stockAlerts !== false,
    marketingOptIn: row.marketingOptIn === true,
    orderUpdates: row.orderUpdates !== false,
  }
}

function allowPushForKind(
  kind: NotificationKind,
  prefs: Awaited<ReturnType<typeof getPrefs>>,
  broadcastSegment?: 'push_enabled' | 'marketing_opt_in',
): boolean {
  if (!prefs.pushEnabled) {
    return false
  }
  if (kind === 'price_drop') {
    return prefs.priceDropAlerts
  }
  if (kind === 'restock') {
    return prefs.stockAlerts
  }
  if (kind === 'broadcast') {
    if (broadcastSegment === 'marketing_opt_in') {
      return prefs.marketingOptIn
    }
    return true
  }
  return true
}

async function recentDuplicateProductAlert(
  payload: Payload,
  userId: number,
  kind: NotificationKind,
  productId: number | undefined,
  windowMs: number,
) {
  const since = new Date(Date.now() - windowMs).toISOString()
  const andClause: Where['and'] = [
    { user: { equals: userId } },
    { kind: { equals: kind } },
    { createdAt: { greater_than: since } },
  ]
  if (productId != null) {
    andClause.push({ product: { equals: productId } })
  }

  const res = await payload.find({
    collection: 'user-notifications',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: {
      and: andClause,
    },
  })
  return res.docs.length > 0
}

async function hasBroadcastForUser(
  payload: Payload,
  userId: number,
  broadcastId: number,
): Promise<boolean> {
  const res = await payload.find({
    collection: 'user-notifications',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: {
      and: [
        { user: { equals: userId } },
        { kind: { equals: 'broadcast' } },
        { broadcast: { equals: broadcastId } },
      ],
    },
  })
  return res.docs.length > 0
}

let vapidConfigured = false

function configureWebPush(): boolean {
  if (vapidConfigured) {
    return true
  }
  const pub = process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  const subject =
    process.env.VAPID_SUBJECT ||
    process.env.VAPID_CONTACT_EMAIL ||
    'mailto:developers@example.com'
  if (!pub || !priv) {
    return false
  }
  webpush.setVapidDetails(subject, pub, priv)
  vapidConfigured = true
  return true
}

function toAbsoluteLink(linkUrl: string | null | undefined): string {
  const base = getServerSideURL()
  if (!linkUrl) {
    return base
  }
  if (linkUrl.startsWith('http://') || linkUrl.startsWith('https://')) {
    return linkUrl
  }
  return `${base}${linkUrl.startsWith('/') ? linkUrl : `/${linkUrl}`}`
}

export async function deliverToUser(args: DeliverArgs): Promise<DeliverResult> {
  const {
    payload,
    req,
    userId,
    title,
    body,
    linkUrl,
    kind,
    productId,
    broadcastId,
    broadcastSegment,
    dedupeProductId,
    skipPush,
  } = args

  if (kind === 'broadcast' && broadcastId != null) {
    if (await hasBroadcastForUser(payload, userId, broadcastId)) {
      return { delivered: false, reason: 'duplicate_broadcast' }
    }
  } else {
    const productKey = dedupeProductId ?? productId ?? undefined
    if (
      productKey != null &&
      (await recentDuplicateProductAlert(payload, userId, kind, productKey, 45 * 60 * 1000))
    ) {
      return { delivered: false, reason: 'duplicate' }
    }
  }

  const prefs = await getPrefs(payload, userId, req)

  if (kind === 'price_drop' && !prefs.priceDropAlerts) {
    return { delivered: false, reason: 'category_disabled' }
  }
  if (kind === 'restock' && !prefs.stockAlerts) {
    return { delivered: false, reason: 'category_disabled' }
  }

  const channels: ('inbox' | 'push')[] = ['inbox']

  if (!skipPush && allowPushForKind(kind, prefs, broadcastSegment) && configureWebPush()) {
    const subs = await payload.find({
      collection: 'push-subscriptions',
      depth: 0,
      limit: 200,
      overrideAccess: true,
      ...(req ? { req } : {}),
      where: {
        user: {
          equals: userId,
        },
      },
    })

    const absoluteUrl = toAbsoluteLink(linkUrl ?? undefined)
    const pushPayload = JSON.stringify({
      body,
      title,
      url: absoluteUrl,
    })

    let pushOk = false
    for (const sub of subs.docs) {
      const doc = sub as {
        id: number
        endpoint?: string
        p256dh?: string | null
        auth?: string | null
      }
      const endpoint = doc.endpoint
      if (!endpoint || endpoint.startsWith('fcm:')) {
        continue
      }
      if (!doc.p256dh || !doc.auth) {
        continue
      }

      try {
        await webpush.sendNotification(
          {
            endpoint,
            keys: {
              auth: doc.auth,
              p256dh: doc.p256dh,
            },
          },
          pushPayload,
        )
        pushOk = true
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode
        if (statusCode === 404 || statusCode === 410) {
          await payload.delete({
            collection: 'push-subscriptions',
            id: doc.id,
            overrideAccess: true,
            ...(req ? { req } : {}),
          })
        }
      }
    }

    if (pushOk) {
      channels.push('push')
    }
  }

  await payload.create({
    collection: 'user-notifications',
    data: {
      body,
      broadcast: broadcastId ?? undefined,
      channels,
      kind,
      linkUrl: linkUrl ?? undefined,
      product: productId ?? undefined,
      title,
      user: userId,
    },
    overrideAccess: true,
    ...(req ? { req } : {}),
  })

  return { delivered: true, channels }
}
