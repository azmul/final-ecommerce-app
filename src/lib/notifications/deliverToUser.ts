import type { Payload, PayloadRequest, Where } from 'payload'
import webpush from 'web-push'

import { getServerSideURL } from '@/utilities/getURL'

/** Debounce repeat sends; price drops allow another row when `priceNow` differs. */
const PRICE_DROP_DEDUPE_MS = 25 * 60 * 1000
const RESTOCK_DEDUPE_MS = 25 * 60 * 1000
/** Rows created before `priceNow` existed: short burst-only duplicate guard. */
const LEGACY_PRICE_DROP_DEDUPE_MS = 3 * 60 * 1000

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
  /** Stored on inbox rows for price-drop alerts (optional). */
  pricePrevious?: number | null
  priceNow?: number | null
  linkUrl?: string | null
  kind: NotificationKind
  productId?: number | null
  broadcastId?: number | null
  /** Required when kind is broadcast; controls push eligibility vs marketing opt-in. */
  broadcastSegment?: 'push_enabled' | 'marketing_opt_in'
  /** When set, duplicate detection keys off this product id (defaults to productId). */
  dedupeProductId?: number | null
  /** For `price_drop`, block repeats only when this new price was already notified recently. */
  dedupePriceNow?: number | null
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
  if (kind === 'system') {
    return prefs.orderUpdates
  }
  return true
}

async function recentDuplicateProductAlert(
  payload: Payload,
  userId: number,
  kind: NotificationKind,
  productId: number | undefined,
  dedupePriceNow?: number | null,
): Promise<boolean> {
  const windowMs = kind === 'price_drop' ? PRICE_DROP_DEDUPE_MS : RESTOCK_DEDUPE_MS
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
    limit: 20,
    overrideAccess: true,
    sort: '-createdAt',
    where: {
      and: andClause,
    },
  })

  if (res.docs.length === 0) {
    return false
  }

  if (kind !== 'price_drop') {
    return true
  }

  const pn = dedupePriceNow != null && Number.isFinite(dedupePriceNow) ? dedupePriceNow : null
  if (pn == null) {
    return true
  }

  for (const doc of res.docs) {
    const row = doc as { createdAt?: string; priceNow?: number | null }
    if (row.priceNow != null && Number.isFinite(Number(row.priceNow))) {
      if (row.priceNow === pn) {
        return true
      }
      continue
    }

    const createdMs = row.createdAt ? new Date(row.createdAt).getTime() : 0
    if (Date.now() - createdMs < LEGACY_PRICE_DROP_DEDUPE_MS) {
      return true
    }
  }

  return false
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

let vapidReady = false
let vapidSetupFailed = false

function configureWebPush(): boolean {
  if (vapidReady) {
    return true
  }
  if (vapidSetupFailed) {
    return false
  }
  const pub = (
    process.env.VAPID_PUBLIC_KEY ||
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
    ''
  ).trim()
  const priv = (process.env.VAPID_PRIVATE_KEY || '').trim()
  const subject =
    (
      process.env.VAPID_SUBJECT ||
      process.env.VAPID_CONTACT_EMAIL ||
      'mailto:developers@example.com'
    ).trim()
  if (!pub || !priv) {
    return false
  }
  try {
    webpush.setVapidDetails(subject, pub, priv)
  } catch (err) {
    vapidSetupFailed = true
    const msg = err instanceof Error ? err.message : String(err)
    console.warn(
      '[deliverToUser] Web Push disabled: invalid VAPID keys (%s). Use keys from `npx web-push generate-vapid-keys`, URL-safe base64 with no "=" padding; ensure public and private are not swapped.',
      msg,
    )
    return false
  }
  vapidReady = true
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
    pricePrevious,
    priceNow,
    linkUrl,
    kind,
    productId,
    broadcastId,
    broadcastSegment,
    dedupeProductId,
    dedupePriceNow,
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
      (await recentDuplicateProductAlert(payload, userId, kind, productKey, dedupePriceNow))
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
  if (kind === 'system' && !prefs.orderUpdates) {
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
      ...(kind === 'price_drop' &&
      pricePrevious != null &&
      priceNow != null &&
      Number.isFinite(pricePrevious) &&
      Number.isFinite(priceNow) ?
        {
          priceNow,
          pricePrevious,
        }
      : {}),
      product: productId ?? undefined,
      title,
      user: userId,
    },
    overrideAccess: true,
    ...(req ? { req } : {}),
  })

  return { delivered: true, channels }
}
