import configPromise from '@payload-config'
import type { MetadataRoute } from 'next'
import { getPayload } from 'payload'

import { getServerSideURL } from '@/utilities/getURL'
import { toAbsoluteUrl } from '@/utilities/getURL'

const MAX = 5000

function computeChangeFrequency(
  updatedAt: string | Date | null | undefined,
): 'daily' | 'weekly' | 'monthly' | 'yearly' {
  if (!updatedAt) return 'yearly'
  const updated = updatedAt instanceof Date ? updatedAt : new Date(updatedAt)
  const time = updated.getTime()
  if (Number.isNaN(time)) return 'yearly'
  const diffDays = (Date.now() - time) / (1000 * 60 * 60 * 24)
  if (diffDays < 7) return 'daily'
  if (diffDays < 30) return 'weekly'
  if (diffDays < 365) return 'monthly'
  return 'yearly'
}

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
        { changeFrequency: computeChangeFrequency(now), lastModified: now, priority: 1, url: `${base}/` },
        { changeFrequency: computeChangeFrequency(now), lastModified: now, priority: 0.9, url: `${base}/shop` },
        { changeFrequency: computeChangeFrequency(now), lastModified: now, priority: 0.8, url: `${base}/blog` },
        { changeFrequency: computeChangeFrequency(now), lastModified: now, priority: 0.6, url: `${base}/all-brands` },
      ]

      for (const doc of pages.docs) {
        if (typeof doc.slug !== 'string' || !doc.slug || doc.slug === 'home') continue
        entries.push({
          changeFrequency: computeChangeFrequency(doc.updatedAt),
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
          changeFrequency: computeChangeFrequency(doc.updatedAt),
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
          changeFrequency: computeChangeFrequency(doc.updatedAt),
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
          changeFrequency: computeChangeFrequency(doc.updatedAt),
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
          changeFrequency: computeChangeFrequency(doc.updatedAt),
          lastModified: doc.updatedAt ? new Date(doc.updatedAt) : now,
          priority: 0.7,
          url: `${base}/blog/${doc.slug}`,
        }))
    }

    case 'images': {
      const [products, categories, brands, posts] = await Promise.all([
        payload.find({
          collection: 'products',
          depth: 2,
          draft: false,
          limit: MAX,
          overrideAccess: false,
          pagination: false,
          select: { slug: true, gallery: true, meta: true, updatedAt: true },
          where: { _status: { equals: 'published' } },
        }),
        payload.find({
          collection: 'categories',
          depth: 2,
          limit: MAX,
          pagination: false,
          select: { slug: true, image: true, updatedAt: true },
        }),
        payload.find({
          collection: 'brands',
          depth: 2,
          limit: MAX,
          pagination: false,
          select: { slug: true, image: true, logo: true, updatedAt: true },
        }),
        payload.find({
          collection: 'posts',
          depth: 2,
          draft: false,
          limit: MAX,
          overrideAccess: false,
          pagination: false,
          select: { slug: true, heroImage: true, image: true, updatedAt: true },
          where: { _status: { equals: 'published' } },
        }),
      ])

      const entries: MetadataRoute.Sitemap = []

      const pushImageEntry = (
        pageUrl: string,
        absolute: string,
        updatedAt: string | Date | null | undefined,
        priority: number,
      ) => {
        entries.push({
          changeFrequency: computeChangeFrequency(updatedAt),
          lastModified: updatedAt ? new Date(updatedAt) : now,
          priority,
          url: pageUrl,
          images: [absolute],
        })
      }

      for (const product of products.docs) {
        if (typeof product.slug !== 'string' || !product.slug) continue
        const pageUrl = `${base}/products/${product.slug}`
        const seen = new Set<string>()

        const addImage = (url: string | null | undefined, title?: string) => {
          if (!url) return
          const absolute = toAbsoluteUrl(url)
          if (!absolute || seen.has(absolute)) return
          seen.add(absolute)
          pushImageEntry(pageUrl, absolute, product.updatedAt, 0.5)
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

      for (const category of categories.docs) {
        if (typeof category.slug !== 'string' || !category.slug) continue
        const pageUrl = `${base}/shop/${category.slug}`
        const seen = new Set<string>()

        const img =
          (category as { image?: unknown }).image &&
          typeof (category as { image?: unknown }).image === 'object' ?
            ((category as { image?: { url?: string | null } }).image ?? null)
          : null
        const url = img?.url ?? undefined
        if (url) {
          const absolute = toAbsoluteUrl(url)
          if (absolute && !seen.has(absolute)) {
            seen.add(absolute)
            pushImageEntry(pageUrl, absolute, category.updatedAt, 0.5)
          }
        }
      }

      for (const brand of brands.docs) {
        if (typeof brand.slug !== 'string' || !brand.slug) continue
        const pageUrl = `${base}/brand/${brand.slug}`
        const seen = new Set<string>()

        const addImage = (url: string | null | undefined) => {
          if (!url) return
          const absolute = toAbsoluteUrl(url)
          if (!absolute || seen.has(absolute)) return
          seen.add(absolute)
          pushImageEntry(pageUrl, absolute, brand.updatedAt, 0.5)
        }

        const brandImage =
          (brand as { image?: unknown }).image &&
          typeof (brand as { image?: unknown }).image === 'object' ?
            ((brand as { image?: { url?: string | null } }).image ?? null)
          : null
        addImage(brandImage?.url ?? undefined)

        const brandLogo =
          (brand as { logo?: unknown }).logo &&
          typeof (brand as { logo?: unknown }).logo === 'object' ?
            ((brand as { logo?: { url?: string | null } }).logo ?? null)
          : null
        addImage(brandLogo?.url ?? undefined)
      }

      for (const post of posts.docs) {
        if (typeof post.slug !== 'string' || !post.slug) continue
        const pageUrl = `${base}/blog/${post.slug}`
        const seen = new Set<string>()

        const addImage = (url: string | null | undefined) => {
          if (!url) return
          const absolute = toAbsoluteUrl(url)
          if (!absolute || seen.has(absolute)) return
          seen.add(absolute)
          pushImageEntry(pageUrl, absolute, post.updatedAt, 0.5)
        }

        const heroImage =
          (post as { heroImage?: unknown }).heroImage &&
          typeof (post as { heroImage?: unknown }).heroImage === 'object' ?
            ((post as { heroImage?: { url?: string | null } }).heroImage ?? null)
          : null
        addImage(heroImage?.url ?? undefined)

        const postImage =
          (post as { image?: unknown }).image &&
          typeof (post as { image?: unknown }).image === 'object' ?
            ((post as { image?: { url?: string | null } }).image ?? null)
          : null
        addImage(postImage?.url ?? undefined)
      }

      return entries
    }

    default:
      return []
  }
}
