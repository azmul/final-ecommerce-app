import configPromise from '@payload-config'
import type { MetadataRoute } from 'next'
import { getPayload } from 'payload'

import { getServerSideURL } from '@/utilities/getURL'

const MAX = 5000

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getServerSideURL()
  const now = new Date()

  const entries: MetadataRoute.Sitemap = [
    { changeFrequency: 'weekly', lastModified: now, priority: 1, url: `${base}/` },
    { changeFrequency: 'weekly', lastModified: now, priority: 0.9, url: `${base}/shop` },
    { changeFrequency: 'weekly', lastModified: now, priority: 0.8, url: `${base}/blog` },
    { changeFrequency: 'monthly', lastModified: now, priority: 0.6, url: `${base}/all-brands` },
  ]

  const payload = await getPayload({ config: configPromise })

  const [pages, posts, products, categories, brands] = await Promise.all([
    payload.find({
      collection: 'pages',
      depth: 0,
      draft: false,
      limit: MAX,
      overrideAccess: false,
      pagination: false,
      select: { slug: true, updatedAt: true },
      where: { _status: { equals: 'published' } },
    }),
    payload.find({
      collection: 'posts',
      depth: 0,
      draft: false,
      limit: MAX,
      overrideAccess: false,
      pagination: false,
      select: { slug: true, updatedAt: true },
      where: { _status: { equals: 'published' } },
    }),
    payload.find({
      collection: 'products',
      depth: 0,
      draft: false,
      limit: MAX,
      overrideAccess: false,
      pagination: false,
      select: { slug: true, updatedAt: true },
      where: { _status: { equals: 'published' } },
    }),
    payload.find({
      collection: 'categories',
      depth: 0,
      limit: MAX,
      pagination: false,
      select: { slug: true, updatedAt: true },
    }),
    payload.find({
      collection: 'brands',
      depth: 0,
      limit: MAX,
      pagination: false,
      select: { slug: true, updatedAt: true },
    }),
  ])

  for (const doc of pages.docs) {
    if (typeof doc.slug !== 'string' || !doc.slug || doc.slug === 'home') continue
    entries.push({
      changeFrequency: 'weekly',
      lastModified: doc.updatedAt ? new Date(doc.updatedAt) : now,
      priority: 0.8,
      url: `${base}/${doc.slug}`,
    })
  }

  for (const doc of posts.docs) {
    if (typeof doc.slug !== 'string' || !doc.slug) continue
    entries.push({
      changeFrequency: 'weekly',
      lastModified: doc.updatedAt ? new Date(doc.updatedAt) : now,
      priority: 0.7,
      url: `${base}/blog/${doc.slug}`,
    })
  }

  for (const doc of products.docs) {
    if (typeof doc.slug !== 'string' || !doc.slug) continue
    entries.push({
      changeFrequency: 'weekly',
      lastModified: doc.updatedAt ? new Date(doc.updatedAt) : now,
      priority: 0.75,
      url: `${base}/products/${doc.slug}`,
    })
  }

  for (const doc of categories.docs) {
    if (typeof doc.slug !== 'string' || !doc.slug) continue
    entries.push({
      changeFrequency: 'weekly',
      lastModified: doc.updatedAt ? new Date(doc.updatedAt) : now,
      priority: 0.7,
      url: `${base}/shop/${doc.slug}`,
    })
  }

  for (const doc of brands.docs) {
    if (typeof doc.slug !== 'string' || !doc.slug) continue
    entries.push({
      changeFrequency: 'monthly',
      lastModified: doc.updatedAt ? new Date(doc.updatedAt) : now,
      priority: 0.55,
      url: `${base}/brand/${doc.slug}`,
    })
  }

  return entries
}
