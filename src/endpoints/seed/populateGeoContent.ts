import type { Payload, PayloadRequest } from 'payload'

import { generatePostGeo } from '@/lib/seo/geoContent/generatePostGeo'
import { generateProductGeo } from '@/lib/seo/geoContent/generateProductGeo'
import { generateTaxonomyGeo } from '@/lib/seo/geoContent/generateTaxonomyGeo'
import { pickCanonicalBySlug } from '@/lib/seo/geoContent/pickCanonical'

export type PopulateGeoOptions = {
  /** Update records that already have aiSummary */
  force?: boolean
  /** Include duplicate slugs (---copy); default keeps one canonical slug per base */
  includeDuplicates?: boolean
  /** Cap per collection (after canonical dedupe) */
  productLimit?: number
  categoryLimit?: number
  brandLimit?: number
  postLimit?: number
}

export type PopulateGeoResult = {
  products: { updated: number; skipped: number }
  categories: { updated: number; skipped: number }
  brands: { updated: number; skipped: number }
  posts: { updated: number; skipped: number }
}

function hasAiSummary(seo: unknown): boolean {
  return Boolean(
    seo &&
      typeof seo === 'object' &&
      'aiSummary' in seo &&
      typeof (seo as { aiSummary?: string }).aiSummary === 'string' &&
      (seo as { aiSummary: string }).aiSummary.trim().length > 0,
  )
}

export async function populateGeoContent({
  payload,
  req,
  options = {},
}: {
  payload: Payload
  req?: PayloadRequest
  options?: PopulateGeoOptions
}): Promise<PopulateGeoResult> {
  const force = options.force ?? false
  const result: PopulateGeoResult = {
    products: { updated: 0, skipped: 0 },
    categories: { updated: 0, skipped: 0 },
    brands: { updated: 0, skipped: 0 },
    posts: { updated: 0, skipped: 0 },
  }

  const [productsRes, categoriesRes, brandsRes, postsRes] = await Promise.all([
    payload.find({
      collection: 'products',
      depth: 1,
      limit: 200,
      pagination: false,
      overrideAccess: true,
      req,
      where: { _status: { equals: 'published' } },
      sort: '-updatedAt',
    }),
    payload.find({
      collection: 'categories',
      depth: 0,
      limit: 200,
      pagination: false,
      overrideAccess: true,
      req,
    }),
    payload.find({
      collection: 'brands',
      depth: 0,
      limit: 200,
      pagination: false,
      overrideAccess: true,
      req,
    }),
    payload.find({
      collection: 'posts',
      depth: 0,
      limit: 200,
      pagination: false,
      overrideAccess: true,
      req,
      where: { _status: { equals: 'published' } },
      sort: '-updatedAt',
    }),
  ])

  const dedupe = <T extends { slug?: string | null; id: string | number }>(docs: T[]) =>
    options.includeDuplicates ? docs : pickCanonicalBySlug(docs)

  const products = dedupe(productsRes.docs).slice(0, options.productLimit ?? 24)
  const categories = dedupe(categoriesRes.docs).slice(0, options.categoryLimit ?? 12)
  const brands = dedupe(brandsRes.docs).slice(0, options.brandLimit ?? 12)
  const posts = dedupe(postsRes.docs).slice(0, options.postLimit ?? 8)

  for (const product of products) {
    if (!force && hasAiSummary(product.seoContent)) {
      result.products.skipped++
      continue
    }

    const seoContent = generateProductGeo({
      title: product.title,
      slug: product.slug,
      meta: product.meta,
      priceInBDT: product.priceInBDT,
      categories: product.categories,
    })

    await payload.update({
      collection: 'products',
      id: product.id,
      depth: 0,
      overrideAccess: true,
      req,
      context: { disableRevalidate: true },
      data: { seoContent },
    })
    result.products.updated++
  }

  for (const category of categories) {
    if (!force && hasAiSummary(category.seoContent)) {
      result.categories.skipped++
      continue
    }

    const seoContent = generateTaxonomyGeo({
      title: category.title,
      slug: category.slug,
      metaDescription: category.meta?.description,
      kind: 'category',
    })

    await payload.update({
      collection: 'categories',
      id: category.id,
      depth: 0,
      overrideAccess: true,
      req,
      context: { disableRevalidate: true },
      data: { seoContent },
    })
    result.categories.updated++
  }

  for (const brand of brands) {
    if (!force && hasAiSummary(brand.seoContent)) {
      result.brands.skipped++
      continue
    }

    const seoContent = generateTaxonomyGeo({
      title: brand.title,
      slug: brand.slug,
      metaDescription: brand.meta?.description,
      kind: 'brand',
    })

    await payload.update({
      collection: 'brands',
      id: brand.id,
      depth: 0,
      overrideAccess: true,
      req,
      context: { disableRevalidate: true },
      data: { seoContent },
    })
    result.brands.updated++
  }

  for (const post of posts) {
    if (!force && hasAiSummary(post.seoContent)) {
      result.posts.skipped++
      continue
    }

    const seoContent = generatePostGeo({
      title: post.title,
      slug: post.slug,
      contentType: post.contentType,
      excerpt: post.excerpt,
      metaDescription: post.meta?.description,
    })

    await payload.update({
      collection: 'posts',
      id: post.id,
      depth: 0,
      overrideAccess: true,
      req,
      context: { disableRevalidate: true },
      data: { seoContent },
    })
    result.posts.updated++
  }

  return result
}
