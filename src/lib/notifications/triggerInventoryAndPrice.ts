import type { Payload, PayloadRequest } from 'payload'

import { deliverToUser } from '@/lib/notifications/deliverToUser'
import {
  CONTEXT_NOTIFICATION_PREV_PRODUCT,
  CONTEXT_NOTIFICATION_PREV_VARIANT,
} from '@/lib/notifications/notificationHookContext'
import { formatMajorDecimalsFromMinor } from '@/lib/notifications/priceDropCopy'

function snapshotFromContext(
  req: PayloadRequest | undefined,
  key: string,
): Record<string, unknown> | undefined {
  const ctx = req?.context as Record<string, unknown> | undefined
  const raw = ctx?.[key]
  if (!raw || typeof raw !== 'object') {
    return undefined
  }
  return raw as Record<string, unknown>
}

function normalizeMoney(value: unknown): number | null {
  if (value == null || value === '') {
    return null
  }
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function normalizeInventory(value: unknown): number {
  if (value == null || value === '') {
    return 0
  }
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

async function fulfillAlert(
  payload: Payload,
  alertId: number,
  req?: PayloadRequest,
): Promise<void> {
  await payload.update({
    id: alertId,
    collection: 'product-alerts',
    data: {
      active: false,
      fulfilledAt: new Date().toISOString(),
    },
    overrideAccess: true,
    ...(req ? { req } : {}),
  })
}

function userIdFromRelation(value: unknown): number | null {
  if (value == null) {
    return null
  }
  if (typeof value === 'object' && 'id' in value) {
    const id = Number((value as { id: number }).id)
    return Number.isFinite(id) ? id : null
  }
  const id = Number(value)
  return Number.isFinite(id) ? id : null
}

export async function notifyProductLevelChange(args: {
  payload: Payload
  req?: PayloadRequest
  doc: Record<string, unknown>
  previousDoc: Record<string, unknown>
}): Promise<void> {
  const { payload, req, doc, previousDoc } = args

  if (doc._status && doc._status !== 'published') {
    return
  }

  const productId = Number(doc.id)
  if (!Number.isFinite(productId)) {
    return
  }

  const slug = typeof doc.slug === 'string' ? doc.slug : undefined
  const title = typeof doc.title === 'string' ? doc.title : 'Product'
  if (!slug) {
    return
  }

  const linkUrl = `/products/${slug}`
  const variantsEnabled = doc.enableVariants === true

  const prevProduct = snapshotFromContext(req, CONTEXT_NOTIFICATION_PREV_PRODUCT)
  const oldPrice = normalizeMoney(prevProduct?.priceInBDT ?? previousDoc.priceInBDT)
  const newPrice = normalizeMoney(doc.priceInBDT)
  const oldInv = normalizeInventory(prevProduct?.inventory ?? previousDoc.inventory)
  const newInv = normalizeInventory(doc.inventory)

  const productPredicates = [
    { active: { equals: true } },
    { product: { equals: productId } },
  ] as const

  if (!variantsEnabled && oldPrice != null && newPrice != null && newPrice < oldPrice) {
    const alerts = await payload.find({
      collection: 'product-alerts',
      depth: 0,
      limit: 500,
      overrideAccess: true,
      ...(req ? { req } : {}),
      where: {
        and: [
          ...productPredicates,
          { alertType: { equals: 'price_drop' } },
          {
            or: [{ variant: { equals: null } }, { variant: { exists: false } }],
          },
        ],
      },
    })

    for (const alert of alerts.docs) {
      const row = alert as {
        id: number
        user?: unknown
        targetPrice?: number | null
      }
      const uid = userIdFromRelation(row.user)
      if (uid == null) {
        continue
      }
      const target = row.targetPrice != null ? Number(row.targetPrice) : null
      if (target != null && newPrice > target) {
        continue
      }

      const roundedOld = Math.round(oldPrice)
      const roundedNew = Math.round(newPrice)
      const sent = await deliverToUser({
        body: `${title} dropped to ${formatMajorDecimalsFromMinor(roundedNew)} BDT (was ${formatMajorDecimalsFromMinor(roundedOld)}).`,
        dedupePriceNow: roundedNew,
        dedupeProductId: productId,
        kind: 'price_drop',
        linkUrl,
        payload,
        priceNow: roundedNew,
        pricePrevious: roundedOld,
        productId,
        req,
        title: `Price drop: ${title}`,
        userId: uid,
      })
      if (sent.delivered) {
        await fulfillAlert(payload, row.id, req)
      }
    }
  }

  if (!variantsEnabled && oldInv <= 0 && newInv > 0) {
    const alerts = await payload.find({
      collection: 'product-alerts',
      depth: 0,
      limit: 500,
      overrideAccess: true,
      ...(req ? { req } : {}),
      where: {
        and: [
          ...productPredicates,
          { alertType: { equals: 'restock' } },
          {
            or: [{ variant: { equals: null } }, { variant: { exists: false } }],
          },
        ],
      },
    })

    for (const alert of alerts.docs) {
      const row = alert as { id: number; user?: unknown }
      const uid = userIdFromRelation(row.user)
      if (uid == null) {
        continue
      }

      const sent = await deliverToUser({
        body: `${title} is back in stock.`,
        dedupeProductId: productId,
        kind: 'restock',
        linkUrl,
        payload,
        productId,
        req,
        title: `Back in stock: ${title}`,
        userId: uid,
      })
      if (sent.delivered) {
        await fulfillAlert(payload, row.id, req)
      }
    }
  }
}

export async function notifyVariantLevelChange(args: {
  payload: Payload
  req?: PayloadRequest
  doc: Record<string, unknown>
  previousDoc: Record<string, unknown>
}): Promise<void> {
  const { payload, req, doc, previousDoc } = args

  if (doc._status && doc._status !== 'published') {
    return
  }

  const variantId = Number(doc.id)
  const productRel = doc.product
  const productId =
    typeof productRel === 'object' && productRel && 'id' in productRel
      ? Number((productRel as { id: number }).id)
      : Number(productRel)

  if (!Number.isFinite(variantId) || !Number.isFinite(productId)) {
    return
  }

  const product = await payload.findByID({
    id: productId,
    collection: 'products',
    depth: 0,
    overrideAccess: true,
    ...(req ? { req } : {}),
  })

  if (!product || (product as { _status?: string })._status !== 'published') {
    return
  }

  const slug = (product as { slug?: string }).slug
  const title = (product as { title?: string }).title ?? 'Product'
  if (!slug) {
    return
  }

  const linkUrl = `/products/${slug}`

  const prevVariant = snapshotFromContext(req, CONTEXT_NOTIFICATION_PREV_VARIANT)
  const oldPrice = normalizeMoney(prevVariant?.priceInBDT ?? previousDoc.priceInBDT)
  const newPrice = normalizeMoney(doc.priceInBDT)
  const oldInv = normalizeInventory(prevVariant?.inventory ?? previousDoc.inventory)
  const newInv = normalizeInventory(doc.inventory)

  const baseWhere = [
    { active: { equals: true } },
    { product: { equals: productId } },
    { variant: { equals: variantId } },
  ] as const

  if (oldPrice != null && newPrice != null && newPrice < oldPrice) {
    const alerts = await payload.find({
      collection: 'product-alerts',
      depth: 0,
      limit: 500,
      overrideAccess: true,
      ...(req ? { req } : {}),
      where: {
        and: [...baseWhere, { alertType: { equals: 'price_drop' } }],
      },
    })

    for (const alert of alerts.docs) {
      const row = alert as {
        id: number
        user?: unknown
        targetPrice?: number | null
      }
      const uid = userIdFromRelation(row.user)
      if (uid == null) {
        continue
      }
      const target = row.targetPrice != null ? Number(row.targetPrice) : null
      if (target != null && newPrice > target) {
        continue
      }

      const roundedOld = Math.round(oldPrice)
      const roundedNew = Math.round(newPrice)
      const sent = await deliverToUser({
        body: `A variant of ${title} dropped to ${formatMajorDecimalsFromMinor(roundedNew)} BDT (was ${formatMajorDecimalsFromMinor(roundedOld)}).`,
        dedupePriceNow: roundedNew,
        dedupeProductId: productId,
        kind: 'price_drop',
        linkUrl,
        payload,
        priceNow: roundedNew,
        pricePrevious: roundedOld,
        productId,
        req,
        title: `Price drop: ${title}`,
        userId: uid,
      })
      if (sent.delivered) {
        await fulfillAlert(payload, row.id, req)
      }
    }
  }

  if (oldInv <= 0 && newInv > 0) {
    const alerts = await payload.find({
      collection: 'product-alerts',
      depth: 0,
      limit: 500,
      overrideAccess: true,
      ...(req ? { req } : {}),
      where: {
        and: [...baseWhere, { alertType: { equals: 'restock' } }],
      },
    })

    for (const alert of alerts.docs) {
      const row = alert as { id: number; user?: unknown }
      const uid = userIdFromRelation(row.user)
      if (uid == null) {
        continue
      }

      const sent = await deliverToUser({
        body: `A variant of ${title} is back in stock.`,
        dedupeProductId: productId,
        kind: 'restock',
        linkUrl,
        payload,
        productId,
        req,
        title: `Back in stock: ${title}`,
        userId: uid,
      })
      if (sent.delivered) {
        await fulfillAlert(payload, row.id, req)
      }
    }
  }
}
