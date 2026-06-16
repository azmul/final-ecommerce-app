# Technical SEO Audit Checklist

Run quarterly or after major releases.

## Crawl & index

- [ ] `/robots.txt` returns 200, references `/sitemap.xml`
- [ ] `/sitemap.xml` is valid sitemap index with all segments
- [ ] No orphan pages (every indexable URL in a sitemap segment)
- [ ] Private routes return `noindex` (cart, checkout, account, compare, wishlist)
- [ ] Filtered shop URLs (`?q=`, sort, brand) are `noindex, follow`
- [ ] Draft/unpublished content not in sitemap
- [ ] 301 redirects configured for changed slugs (`redirects.ts`)
- [ ] No redirect chains > 2 hops
- [ ] HTTPS enforced; `metadataBase` matches production domain

## Metadata

- [ ] Every indexable page has unique `<title>` (≤ 60 chars ideal)
- [ ] Every indexable page has unique meta description (120–160 chars)
- [ ] Canonical URL self-referencing on clean URLs
- [ ] Open Graph tags present (title, description, image, url)
- [ ] Twitter Card tags present (`summary_large_image`)
- [ ] Root `opengraph-image.tsx` fallback works
- [ ] `ai-summary` meta on products, taxonomy, blog

## Structured data

- [ ] Organization + WebSite + SearchAction on all pages (root layout)
- [ ] Product schema: name, description, image, offers, availability
- [ ] AggregateRating when reviews exist
- [ ] Individual Review nodes (up to 10 approved reviews)
- [ ] FAQPage when CMS FAQs populated
- [ ] BreadcrumbList on PDP, shop, category, brand
- [ ] CollectionPage + ItemList on listing pages
- [ ] BlogPosting/HowTo on blog posts with Person author
- [ ] No schema validation errors in Rich Results Test

## URL structure

- [ ] Products: `/products/{slug}`
- [ ] Categories: `/shop/{categorySlug}`
- [ ] Brands: `/brand/{slug}`
- [ ] Blog: `/blog/{slug}`
- [ ] Lowercase, hyphenated slugs
- [ ] No session IDs or tracking params in canonical URLs

## Performance & CWV

- [ ] LCP < 2.5s on homepage and PDP
- [ ] CLS < 0.1
- [ ] INP < 200ms
- [ ] Images use next-gen formats (AVIF/WebP)
- [ ] LCP image preloaded on PDP

## Mobile & accessibility

- [ ] Viewport meta configured
- [ ] Tap targets ≥ 48px
- [ ] Breadcrumb nav accessible (`aria-label="Breadcrumb"`)
- [ ] One H1 per page
- [ ] Lighthouse Accessibility ≥ 95

## AI / GEO readiness

- [ ] `/llms.txt` and `/llms-full.txt` accessible
- [ ] `/api/ai` discovery endpoint returns 200
- [ ] Product/category/brand/article AI APIs return structured JSON
- [ ] Google Merchant feed valid XML
- [ ] AI bots allowed in robots.txt for llms + AI API paths
- [ ] Top catalog items have GEO content populated

## Analytics & verification

- [ ] Google Search Console verified
- [ ] Bing Webmaster Tools verified
- [ ] Sitemap submitted in both consoles
- [ ] GA4 receiving page views and e-commerce events
- [ ] IndexNow key file reachable (if configured)

## Content quality (E-E-A-T)

- [ ] About page linked from footer
- [ ] Contact information visible and in Organization schema
- [ ] Returns/shipping policy pages exist
- [ ] Privacy policy published
- [ ] Product reviews from real customers
- [ ] Blog posts attributed to authors
