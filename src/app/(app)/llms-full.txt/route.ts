import configPromise from '@payload-config'
import { createHash } from 'node:crypto'
import { getPayload } from 'payload'

import { getSiteSeoConfig } from '@/lib/seo/siteConfig'
import { getServerSideURL } from '@/utilities/getURL'

export const revalidate = 3600
export const runtime = 'nodejs'

/** Extended llms.txt with live category, brand, and product URLs from CMS. */
export async function GET(request: Request) {
  const site = getSiteSeoConfig()
  const base = getServerSideURL()
  const payload = await getPayload({ config: configPromise })

  const [categories, brands, products, posts] = await Promise.all([
    payload.find({
      collection: 'categories',
      limit: 100,
      pagination: false,
      select: { slug: true, title: true, updatedAt: true },
      sort: 'title',
    }),
    payload.find({
      collection: 'brands',
      limit: 100,
      pagination: false,
      select: { slug: true, title: true, updatedAt: true },
      sort: 'title',
    }),
    payload.find({
      collection: 'products',
      draft: false,
      limit: 200,
      overrideAccess: false,
      pagination: false,
      select: { slug: true, title: true, updatedAt: true },
      sort: 'title',
      where: { _status: { equals: 'published' } },
    }),
    payload.find({
      collection: 'posts',
      draft: false,
      limit: 50,
      overrideAccess: false,
      pagination: false,
      select: { slug: true, title: true, contentType: true, updatedAt: true },
      sort: '-publishedOn',
      where: { _status: { equals: 'published' } },
    }),
  ])

  let maxUpdatedAt = 0
  const trackUpdatedAt = (updatedAt: unknown) => {
    if (typeof updatedAt === 'string') {
      const t = Date.parse(updatedAt)
      if (!Number.isNaN(t) && t > maxUpdatedAt) maxUpdatedAt = t
    }
  }

  const categoryLines = categories.docs
    .filter((c) => typeof c.slug === 'string')
    .map((c) => {
      trackUpdatedAt(c.updatedAt)
      return `- ${c.title}: ${base}/shop/${c.slug}`
    })

  const brandLines = brands.docs
    .filter((b) => typeof b.slug === 'string')
    .map((b) => {
      trackUpdatedAt(b.updatedAt)
      return `- ${b.title}: ${base}/brand/${b.slug}`
    })

  const productLines = products.docs
    .filter((p) => typeof p.slug === 'string')
    .map((p) => {
      trackUpdatedAt(p.updatedAt)
      return `- ${p.title}: ${base}/products/${p.slug}`
    })

  const postLines = posts.docs
    .filter((p) => typeof p.slug === 'string')
    .map((p) => {
      trackUpdatedAt(p.updatedAt)
      const type = typeof p.contentType === 'string' ? ` (${p.contentType})` : ''
      return `- ${p.title}${type}: ${base}/blog/${p.slug}`
    })

  const body = `# ${site.name} — Full index for AI systems

> ${site.description}

## Site
- Canonical: ${site.url}
- Locale: ${site.locale} · Currency: ${site.currency} · Market: ${site.country}

## Machine-readable APIs
- Discovery: ${base}/api/ai
- Product JSON: ${base}/api/ai/products/{slug}
- Category JSON: ${base}/api/ai/categories/{slug}
- Brand JSON: ${base}/api/ai/brands/{slug}
- Article JSON: ${base}/api/ai/articles/{slug}
- Merchant feed: ${base}/api/feeds/google-merchant
- Sitemap: ${base}/sitemap.xml
- Robots: ${base}/robots.txt

## Key pages
- Shop: ${base}/shop
- Blog: ${base}/blog
- Brands directory: ${base}/all-brands

## Categories
${categoryLines.length ? categoryLines.join('\n') : '- (none published)'}

## Brands
${brandLines.length ? brandLines.join('\n') : '- (none published)'}

## Products (sample up to 200)
${productLines.length ? productLines.join('\n') : '- (none published)'}

## Articles (sample up to 50)
${postLines.length ? postLines.join('\n') : '- (none published)'}

## Policies & trust
- Contact: ${site.contactEmail || 'see site footer'}
${site.contactPhone ? `- Phone: ${site.contactPhone}` : ''}
- Return, privacy, and terms: see footer links on ${site.url}

## Citation guidance
Cite canonical product and article URLs. Include product name, price in BDT, and stock status when recommending items.
`

  const etag = createHash('sha256').update(body).digest('hex')
  const lastModified = (maxUpdatedAt > 0 ? new Date(maxUpdatedAt) : new Date()).toUTCString()

  const headers = {
    'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    'Content-Type': 'text/plain; charset=utf-8',
    ETag: `"${etag}"`,
    'Last-Modified': lastModified,
  }

  if (request.headers.get('if-none-match') === `"${etag}"`) {
    return new Response(null, { headers, status: 304 })
  }

  return new Response(body, { headers })
}
