import type { Payload } from 'payload'

type NotificationRow = {
  id: number
  kind?: 'price_drop' | 'restock' | 'broadcast' | 'system' | string
  linkUrl?: string | null
  product?: number | null
}

const ADMIN_PRODUCT_IN_PATH = /\/admin\/collections\/products\/(\d+)/
const ADMIN_RETURN_REQUEST_IN_PATH = /\/admin\/collections\/return-requests\/(\d+)/
const ADMIN_ORDER_IN_PATH = /\/admin\/collections\/orders\/(\d+)/

function pathnameFromLink(linkUrl: string): string {
  const trimmed = linkUrl.trim()
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      return new URL(trimmed).pathname
    } catch {
      return trimmed
    }
  }
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
}

function idFromAdminPath(
  linkUrl: string | null | undefined,
  pattern: RegExp,
): number | null {
  if (!linkUrl?.trim()) {
    return null
  }
  const match = pathnameFromLink(linkUrl).match(pattern)
  if (!match?.[1]) {
    return null
  }
  const id = Number(match[1])
  return Number.isFinite(id) ? id : null
}

function adminProductIdFromLink(linkUrl: string | null | undefined): number | null {
  return idFromAdminPath(linkUrl, ADMIN_PRODUCT_IN_PATH)
}

function adminReturnRequestIdFromLink(linkUrl: string | null | undefined): number | null {
  return idFromAdminPath(linkUrl, ADMIN_RETURN_REQUEST_IN_PATH)
}

function adminOrderIdFromLink(linkUrl: string | null | undefined): number | null {
  return idFromAdminPath(linkUrl, ADMIN_ORDER_IN_PATH)
}

function slugForProductAlert(
  doc: NotificationRow,
  slugsByProductId: Map<number, string>,
): string | null {
  if (doc.kind !== 'price_drop' && doc.kind !== 'restock') {
    return null
  }
  if (typeof doc.product !== 'number') {
    return null
  }
  return slugsByProductId.get(doc.product) ?? null
}

function resolveStorefrontLink(
  doc: NotificationRow,
  slugsByProductId: Map<number, string>,
  orderIdByReturnRequestId: Map<number, number>,
): string | null {
  const raw = doc.linkUrl?.trim() || null

  if (raw) {
    const adminProductId = adminProductIdFromLink(raw)
    if (adminProductId != null) {
      const slug = slugsByProductId.get(adminProductId)
      return slug ? `/products/${slug}` : null
    }

    const returnRequestId = adminReturnRequestIdFromLink(raw)
    if (returnRequestId != null) {
      const orderId = orderIdByReturnRequestId.get(returnRequestId)
      return orderId != null ? `/orders/${orderId}` : null
    }

    const adminOrderId = adminOrderIdFromLink(raw)
    if (adminOrderId != null) {
      return `/orders/${adminOrderId}`
    }

    const path = pathnameFromLink(raw)
    if (path.startsWith('/products/') || path.startsWith('/orders/')) {
      return path
    }

    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      return raw
    }

    return raw.startsWith('/') ? raw : `/${raw}`
  }

  const alertSlug = slugForProductAlert(doc, slugsByProductId)
  return alertSlug ? `/products/${alertSlug}` : null
}

export async function enrichNotificationsWithStorefrontUrls<T extends NotificationRow>(
  payload: Payload,
  docs: T[],
): Promise<T[]> {
  if (!docs.length) {
    return docs
  }

  const productIds = new Set<number>()
  const returnRequestIds = new Set<number>()
  for (const doc of docs) {
    if (typeof doc.product === 'number') {
      productIds.add(doc.product)
    }
    const fromLink = adminProductIdFromLink(doc.linkUrl)
    if (fromLink != null) {
      productIds.add(fromLink)
    }
    const returnRequestId = adminReturnRequestIdFromLink(doc.linkUrl)
    if (returnRequestId != null) {
      returnRequestIds.add(returnRequestId)
    }
  }

  const slugsByProductId = new Map<number, string>()
  if (productIds.size > 0) {
    const products = await payload.find({
      collection: 'products',
      depth: 0,
      limit: productIds.size,
      overrideAccess: true,
      pagination: false,
      select: {
        slug: true,
      },
      where: {
        id: {
          in: [...productIds],
        },
      },
    })

    for (const row of products.docs) {
      const id = typeof row.id === 'number' ? row.id : Number(row.id)
      const slug = typeof row.slug === 'string' ? row.slug.trim() : ''
      if (Number.isFinite(id) && slug) {
        slugsByProductId.set(id, slug)
      }
    }
  }

  const orderIdByReturnRequestId = new Map<number, number>()
  if (returnRequestIds.size > 0) {
    const returnRequests = await payload.find({
      collection: 'return-requests',
      depth: 0,
      limit: returnRequestIds.size,
      overrideAccess: true,
      pagination: false,
      select: {
        order: true,
      },
      where: {
        id: {
          in: [...returnRequestIds],
        },
      },
    })

    for (const row of returnRequests.docs) {
      const requestId = typeof row.id === 'number' ? row.id : Number(row.id)
      const order = row.order
      const orderId =
        typeof order === 'number' ? order
        : order && typeof order === 'object' && 'id' in order ?
          Number((order as { id: unknown }).id)
        : Number.NaN
      if (Number.isFinite(requestId) && Number.isFinite(orderId)) {
        orderIdByReturnRequestId.set(requestId, orderId)
      }
    }
  }

  return docs.map((doc) => {
    const linkUrl = resolveStorefrontLink(doc, slugsByProductId, orderIdByReturnRequestId)
    if (!linkUrl || linkUrl === doc.linkUrl) {
      return doc
    }
    return { ...doc, linkUrl }
  })
}
