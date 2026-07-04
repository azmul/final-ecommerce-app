import configPromise from '@payload-config'
import type { Category, Post, Product } from '@/payload-types'
import { getPayload } from 'payload'

import {
  getPostSeoContent,
  getTaxonomySeoContent,
  parseFaqs,
} from '@/lib/seo/resolveGeoContent'
import { getServerSideURL } from '@/utilities/getURL'

export type AiContentResponse = {
  type: 'product' | 'category' | 'article' | 'brand'
  slug: string
  url: string
  title: string
  summary: string
  description?: string
  keyFacts: string[]
  faqs: { question: string; answer: string }[]
  attributes: Record<string, string | number | boolean | null>
  pricing?: {
    currency: string
    amount?: number
    availability: 'in_stock' | 'out_of_stock'
  }
  related?: { type: string; title: string; url: string }[]
  lastModified?: string
  publisher: { name: string; url: string }
}

function publisher() {
  const url = getServerSideURL()
  return {
    name: process.env.SITE_NAME || process.env.COMPANY_NAME || 'Store',
    url,
  }
}

export async function getAiProductContent(slug: string): Promise<AiContentResponse | null> {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'products',
    depth: 2,
    draft: false,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] },
  })

  const product = result.docs[0] as Product | undefined
  if (!product) return null

  const base = getServerSideURL()
  const url = `${base}/products/${slug}`
  const seo = (product as Product & { seoContent?: { aiSummary?: string; keyFeatures?: { feature?: string }[] } })
    .seoContent

  let price: number | undefined =
    typeof product.priceInBDT === 'number' ? product.priceInBDT : undefined
  if (product.enableVariants && product.variants?.docs?.length) {
    for (const v of product.variants.docs) {
      if (v && typeof v === 'object' && typeof v.priceInBDT === 'number') {
        if (price === undefined || v.priceInBDT > price) price = v.priceInBDT
      }
    }
  }

  const hasStock = product.enableVariants
    ? Boolean(product.variants?.docs?.some((v) => v && typeof v === 'object' && (v.inventory ?? 0) > 0))
    : (product.inventory ?? 0) > 0

  const brandName =
    product.brand && typeof product.brand === 'object' && typeof product.brand.title === 'string' ?
      product.brand.title
    : null

  const category =
    product.categories?.find((c): c is Category => typeof c === 'object') ?? null

  const keyFacts =
    seo?.keyFeatures
      ?.map((row) => (typeof row?.feature === 'string' ? row.feature.trim() : ''))
      .filter(Boolean) ?? []

  const faqs = parseFaqs(seo?.faqs)

  const related =
    product.relatedProducts
      ?.filter((p): p is Product => typeof p === 'object' && typeof p.slug === 'string')
      .slice(0, 6)
      .map((p) => ({
        type: 'product',
        title: p.title,
        url: `${base}/products/${p.slug}`,
      })) ?? []

  return {
    type: 'product',
    slug,
    url,
    title: product.title,
    summary:
      seo?.aiSummary?.trim() ||
      product.meta?.description?.trim() ||
      `Shop ${product.title} online in Bangladesh.`,
    description: product.meta?.description?.trim() || undefined,
    keyFacts,
    faqs,
    attributes: {
      brand: brandName,
      category: category && typeof category.title === 'string' ? category.title : null,
      sku: product.identifiers?.sku?.trim() || slug,
      reviewAverage: product.reviewAverageRating ?? null,
      reviewCount: product.reviewCount ?? null,
    },
    pricing: {
      currency: 'BDT',
      amount: typeof price === 'number' ? price : undefined,
      availability: hasStock ? 'in_stock' : 'out_of_stock',
    },
    related,
    lastModified: product.updatedAt ?? undefined,
    publisher: publisher(),
  }
}

export async function getAiCategoryContent(slug: string): Promise<AiContentResponse | null> {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'categories',
    depth: 0,
    limit: 1,
    pagination: false,
    where: { slug: { equals: slug } },
  })

  const category = result.docs[0]
  if (!category || typeof category.title !== 'string') return null

  const base = getServerSideURL()
  const url = `${base}/shop/${slug}`
  const seo = getTaxonomySeoContent(category)
  const faqs = parseFaqs(seo?.faqs)

  const products = await payload.find({
    collection: 'products',
    depth: 0,
    draft: false,
    limit: 12,
    overrideAccess: false,
    pagination: false,
    select: { slug: true, title: true },
    where: {
      and: [
        { _status: { equals: 'published' } },
        { categories: { contains: category.id } },
      ],
    },
  })

  return {
    type: 'category',
    slug,
    url,
    title: category.title,
    summary:
      seo?.aiSummary?.trim() ||
      (typeof category.meta === 'object' && category.meta && 'description' in category.meta ?
        String((category.meta as { description?: string }).description || '').trim()
      : '') ||
      `Browse ${category.title} products online in Bangladesh.`,
    keyFacts: [seo?.overview, seo?.buyingGuide].filter((s): s is string => Boolean(s?.trim())),
    faqs,
    attributes: { productCount: products.totalDocs },
    related: products.docs
      .filter((p) => typeof p.slug === 'string')
      .map((p) => ({
        type: 'product',
        title: p.title,
        url: `${base}/products/${p.slug}`,
      })),
    lastModified: category.updatedAt ?? undefined,
    publisher: publisher(),
  }
}

export async function getAiBrandContent(slug: string): Promise<AiContentResponse | null> {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'brands',
    depth: 0,
    limit: 1,
    pagination: false,
    where: { slug: { equals: slug } },
  })

  const brand = result.docs[0]
  if (!brand || typeof brand.title !== 'string') return null

  const base = getServerSideURL()
  const url = `${base}/brand/${slug}`
  const seo = getTaxonomySeoContent(brand)
  const faqs = parseFaqs(seo?.faqs)

  return {
    type: 'brand',
    slug,
    url,
    title: brand.title,
    summary:
      seo?.aiSummary?.trim() ||
      (typeof brand.description === 'string' ? brand.description.trim() : '') ||
      `Shop ${brand.title} products online in Bangladesh.`,
    keyFacts: [seo?.overview, seo?.buyingGuide].filter((s): s is string => Boolean(s?.trim())),
    faqs,
    attributes: {},
    lastModified: brand.updatedAt ?? undefined,
    publisher: publisher(),
  }
}

export async function getAiArticleContent(slug: string): Promise<AiContentResponse | null> {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'posts',
    depth: 2,
    draft: false,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] },
  })

  const post = result.docs[0] as Post | undefined
  if (!post) return null

  const base = getServerSideURL()
  const url = `${base}/blog/${slug}`
  const seo = getPostSeoContent(post)
  const faqs = parseFaqs(seo?.faqs)

  const keyFacts =
    seo?.keyTakeaways
      ?.map((row) => (typeof row?.point === 'string' ? row.point.trim() : ''))
      .filter(Boolean) ?? []

  const author =
    post.author && typeof post.author === 'object' ?
      { name: post.author.name ?? null, email: post.author.email ?? null }
    : null

  return {
    type: 'article',
    slug,
    url,
    title: post.title,
    summary:
      seo?.aiSummary?.trim() ||
      post.excerpt?.trim() ||
      post.meta?.description?.trim() ||
      post.title,
    description: post.meta?.description?.trim() || post.excerpt?.trim() || undefined,
    keyFacts,
    faqs,
    attributes: {
      contentType: post.contentType || 'article',
      author: author?.name ?? null,
      publishedOn: post.publishedOn ?? null,
    },
    related:
      post.relatedPosts
        ?.filter((p): p is Post => typeof p === 'object' && typeof p.slug === 'string')
        .slice(0, 6)
        .map((p) => ({
          type: 'article',
          title: p.title,
          url: `${base}/blog/${p.slug}`,
        })) ?? [],
    lastModified: post.updatedAt ?? undefined,
    publisher: publisher(),
  }
}

export type AiDiscoveryResponse = { endpoints: Record<string, string> }

export function aiJsonResponse(data: AiContentResponse | AiDiscoveryResponse) {
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      'Cache-Control': 'public, max-age=300, s-maxage=3600',
      'Content-Type': 'application/json; charset=utf-8',
    },
  })
}
