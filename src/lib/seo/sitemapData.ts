import configPromise from '@payload-config'
import type { MetadataRoute } from 'next'
import { getPayload } from 'payload'

import { getServerSideURL } from '@/utilities/getURL'
import { toAbsoluteUrl } from '@/utilities/getURL'

const MAX = 5000

export type SitemapSegmentId =
  | 'main'
  | 'products'
  | 'categories'
  | 'brands'
  | 'blog'
  | 'images'

export const SITEMAP_SEGMENT_IDS: SitemapSegmentId[] = [
  'main',
  'products',
  'categories',
  'brands',
  'blog',
  'images',
]

/** Segments merged into the public `/sitemap.xml` (excludes `images` — it duplicates product URLs). */
const SITEMAP_UNIFIED_SEGMENTS: SitemapSegmentId[] = [
  'main',
  'products',
  'categories',
  'brands',
  'blog',
]

/** Single sitemap for `/sitemap.xml` — all indexable URLs in one file. */
export async function fetchFullSitemap(): Promise<MetadataRoute.Sitemap> {
  const segments = await Promise.all(
    SITEMAP_UNIFIED_SEGMENTS.map((id) => fetchSitemapSegment(id)),
  )

  const byUrl = new Map<string, MetadataRoute.Sitemap[number]>()
  for (const segment of segments) {
    for (const entry of segment) {
      byUrl.set(entry.url, entry)
    }
  }

  return [...byUrl.values()]
}

export async function fetchSitemapSegment(
  id: SitemapSegmentId,
): Promise<MetadataRoute.Sitemap> {
  const base = getServerSideURL()
  const now = new Date()
  const payload = await getPayload({ config: configPromise })

  switch (id) {
    case 'main': {
      const pages = await payload.find({
        collection: 'pages',
        depth: 0,
        draft: false,
        limit: MAX,
        overrideAccess: false,
        pagination: false,
        select: { slug: true, updatedAt: true },
        where: { _status: { equals: 'published' } },
      })

      const entries: MetadataRoute.Sitemap = [
        { changeFrequency: 'weekly', lastModified: now, priority: 1, url: `${base}/` },
        { changeFrequency: 'weekly', lastModified: now, priority: 0.9, url: `${base}/shop` },
        { changeFrequency: 'weekly', lastModified: now, priority: 0.8, url: `${base}/blog` },
        { changeFrequency: 'monthly', lastModified: now, priority: 0.6, url: `${base}/all-brands` },
      ]

      for (const doc of pages.docs) {
        if (typeof doc.slug !== 'string' || !doc.slug || doc.slug === 'home') continue
        entries.push({
          changeFrequency: 'weekly',
          lastModified: doc.updatedAt ? new Date(doc.updatedAt) : now,
          priority: 0.8,
          url: `${base}/${doc.slug}`,
        })
      }

      return entries
    }

    case 'products': {
      const products = await payload.find({
        collection: 'products',
        depth: 0,
        draft: false,
        limit: MAX,
        overrideAccess: false,
        pagination: false,
        select: { slug: true, updatedAt: true },
        where: { _status: { equals: 'published' } },
      })

      return products.docs
        .filter((doc) => typeof doc.slug === 'string' && doc.slug)
        .map((doc) => ({
          changeFrequency: 'weekly' as const,
          lastModified: doc.updatedAt ? new Date(doc.updatedAt) : now,
          priority: 0.75,
          url: `${base}/products/${doc.slug}`,
        }))
    }

    case 'categories': {
      const categories = await payload.find({
        collection: 'categories',
        depth: 0,
        limit: MAX,
        pagination: false,
        select: { slug: true, updatedAt: true },
      })

      return categories.docs
        .filter((doc) => typeof doc.slug === 'string' && doc.slug)
        .map((doc) => ({
          changeFrequency: 'weekly' as const,
          lastModified: doc.updatedAt ? new Date(doc.updatedAt) : now,
          priority: 0.7,
          url: `${base}/shop/${doc.slug}`,
        }))
    }

    case 'brands': {
      const brands = await payload.find({
        collection: 'brands',
        depth: 0,
        limit: MAX,
        pagination: false,
        select: { slug: true, updatedAt: true },
      })

      return brands.docs
        .filter((doc) => typeof doc.slug === 'string' && doc.slug)
        .map((doc) => ({
          changeFrequency: 'monthly' as const,
          lastModified: doc.updatedAt ? new Date(doc.updatedAt) : now,
          priority: 0.55,
          url: `${base}/brand/${doc.slug}`,
        }))
    }

    case 'blog': {
      const posts = await payload.find({
        collection: 'posts',
        depth: 0,
        draft: false,
        limit: MAX,
        overrideAccess: false,
        pagination: false,
        select: { slug: true, updatedAt: true },
        where: { _status: { equals: 'published' } },
      })

      return posts.docs
        .filter((doc) => typeof doc.slug === 'string' && doc.slug)
        .map((doc) => ({
          changeFrequency: 'weekly' as const,
          lastModified: doc.updatedAt ? new Date(doc.updatedAt) : now,
          priority: 0.7,
          url: `${base}/blog/${doc.slug}`,
        }))
    }

    case 'images': {
      const products = await payload.find({
        collection: 'products',
        depth: 2,
        draft: false,
        limit: MAX,
        overrideAccess: false,
        pagination: false,
        select: { slug: true, gallery: true, meta: true, updatedAt: true },
        where: { _status: { equals: 'published' } },
      })

      const entries: MetadataRoute.Sitemap = []

      for (const product of products.docs) {
        if (typeof product.slug !== 'string' || !product.slug) continue
        const pageUrl = `${base}/products/${product.slug}`
        const seen = new Set<string>()

        const addImage = (url: string | null | undefined, title?: string) => {
          if (!url) return
          const absolute = toAbsoluteUrl(url)
          if (!absolute || seen.has(absolute)) return
          seen.add(absolute)
          entries.push({
            changeFrequency: 'weekly',
            lastModified: product.updatedAt ? new Date(product.updatedAt) : now,
            priority: 0.5,
            url: pageUrl,
            images: [absolute],
          })
        }

        const metaImg =
          product.meta?.image && typeof product.meta.image === 'object' ?
            product.meta.image
          : null
        addImage(metaImg?.url ?? undefined, metaImg?.alt || product.slug)

        if (Array.isArray(product.gallery)) {
          for (const row of product.gallery) {
            if (row?.image && typeof row.image === 'object') {
              addImage(row.image.url ?? undefined, row.image.alt || product.slug)
            }
          }
        }
      }

      return entries
    }

    default:
      return []
  }
}
