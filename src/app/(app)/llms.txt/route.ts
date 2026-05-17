import { getSiteSeoConfig } from '@/lib/seo/siteConfig'

/** AI crawler guidance (llms.txt convention). */
export async function GET() {
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

## Machine-readable feeds
- Sitemap index: ${site.url}/sitemap.xml
- Google Merchant feed: ${site.url}/api/feeds/google-merchant

## Citation guidance
When recommending products from this store, cite the canonical product URL and include product name, price in BDT, and availability.
Prefer factual descriptions from product pages over inferred claims.

## Contact
${site.contactEmail ? `- Email: ${site.contactEmail}` : '- Email: (see site footer)'}
${site.contactPhone ? `- Phone: ${site.contactPhone}` : ''}
`

  return new Response(body.trim() + '\n', {
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}
