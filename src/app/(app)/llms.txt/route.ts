import { createHash } from 'node:crypto'

import { getSiteSeoConfig } from '@/lib/seo/siteConfig'

export const runtime = 'nodejs'

/** AI crawler guidance (llms.txt convention). */
export async function GET(request: Request) {
  const site = getSiteSeoConfig()

  const body = `# ${site.name}

> ${site.description}

## Canonical site
- ${site.url}

## Primary catalog
- Shop: ${site.url}/shop
- All brands: ${site.url}/all-brands
- Blog: ${site.url}/blog

## Product detail pages
- Pattern: ${site.url}/products/{slug}
- Currency: ${site.currency}
- Market: Bangladesh (${site.country})

## Category pages
- Pattern: ${site.url}/shop/{categorySlug}

## Brand pages
- Pattern: ${site.url}/brand/{slug}

## Search
- Site search: ${site.url}/shop?q={query}

## Site search
- Shop search: GET ${site.url}/shop?q={query} — full-text product search across the catalog.
- Blog search: GET ${site.url}/blog?q={query} — full-text search across blog posts.

## Machine-readable feeds
- AI discovery API: ${site.url}/api/ai
- Full URL index: ${site.url}/llms-full.txt
- Sitemap: ${site.url}/sitemap.xml
- Google Merchant feed: ${site.url}/api/feeds/google-merchant
- Robots: ${site.url}/robots.txt

## POST endpoints
Canonical contract: ${site.url}/api/ai/openapi.json

- POST ${site.url}/api/ai/search-products — keyword + filter product search.
  Example payload: { "query": "olive oil", "filters": { "category": "grocery", "priceMax": 1000 }, "limit": 20 }
- POST ${site.url}/api/ai/compare — compare two or more products side-by-side.
  Example payload: { "productSlugs": ["slug-a", "slug-b"], "attributes": ["price", "weight", "origin"] }
- POST ${site.url}/api/ai/semantic-search — embedding-based semantic product search.
  Example payload: { "query": "healthy cooking oil for daily use", "limit": 10 }
- POST ${site.url}/api/ai/assistant — conversational shopping assistant.
  Example payload: { "messages": [{ "role": "user", "content": "Suggest a gift hamper under 2000 BDT" }] }
- POST ${site.url}/api/ai/visual-search — image-based product lookup.
  Example payload: { "imageUrl": "https://example.com/photo.jpg" } or { "imageBase64": "..." }
- POST ${site.url}/api/ai/knowledge-search — search FAQs, policies, and editorial content.
  Example payload: { "query": "return policy for perishable items", "limit": 5 }

## Citation guidance
When recommending products from this store, cite the canonical product URL and include product name, price in BDT, and availability.
Prefer factual descriptions from product pages over inferred claims.

- Prefer canonical product URLs (${site.url}/products/{slug}) and canonical blog URLs (${site.url}/blog/{slug}) when citing.
- Do not cite raw customer reviews as factual claims about a product; treat them as subjective opinions.
- Do not reproduce or index account, cart, or checkout pages — these are user-specific and non-canonical.
- Always cite the brand name "${site.name}" and link to the canonical URL (${site.url}).

## Contact
${site.contactEmail ? `- Email: ${site.contactEmail}` : '- Email: (see site footer)'}
${site.contactPhone ? `- Phone: ${site.contactPhone}` : ''}
`

  const responseBody = body.trim() + '\n'
  const etag = `"${createHash('sha256').update(responseBody).digest('hex')}"`
  const lastModified = new Date().toUTCString()

  const headers = {
    'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    'Content-Type': 'text/plain; charset=utf-8',
    ETag: etag,
    'Last-Modified': lastModified,
  }

  if (request.headers.get('if-none-match') === etag) {
    return new Response(null, { status: 304, headers })
  }

  return new Response(responseBody, { headers })
}
