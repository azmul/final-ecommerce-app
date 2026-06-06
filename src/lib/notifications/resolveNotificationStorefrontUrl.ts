import type { Payload } from 'payload'

type NotificationRow = {
  id: number
  kind?: 'price_drop' | 'restock' | 'broadcast' | 'system' | string
  linkUrl?: string | null
  product?: number | null
}

const ADMIN_PRODUCT_IN_PATH = /\/admin\/collections\/products\/(\d+)/

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

function adminProductIdFromLink(linkUrl: string | null | undefined): number | null {
  if (!linkUrl?.trim()) {
    return null
  }
  const match = pathnameFromLink(linkUrl).match(ADMIN_PRODUCT_IN_PATH)
  if (!match?.[1]) {
    return null
  }
  const id = Number(match[1])
  return Number.isFinite(id) ? id : null
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
): string | null {
  const raw = doc.linkUrl?.trim() || null

  if (raw) {
    const adminProductId = adminProductIdFromLink(raw)
    if (adminProductId != null) {
      const slug = slugsByProductId.get(adminProductId)
      return slug ? `/products/${slug}` : null
    }

    const path = pathnameFromLink(raw)
    if (path.startsWith('/products/')) {
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
  for (const doc of docs) {
    if (typeof doc.product === 'number') {
      productIds.add(doc.product)
    }
    const fromLink = adminProductIdFromLink(doc.linkUrl)
    if (fromLink != null) {
      productIds.add(fromLink)
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

  return docs.map((doc) => {
    const linkUrl = resolveStorefrontLink(doc, slugsByProductId)
    if (!linkUrl || linkUrl === doc.linkUrl) {
      return doc
    }
    return { ...doc, linkUrl }
  })
}
