# Indexing & Crawling Strategy

## Sitemap architecture

The storefront exposes a **sitemap index** at `/sitemap.xml` with segmented child sitemaps:

| Segment | URL | Contents |
|---------|-----|----------|
| Main | `/sitemap/main.xml` | Home, shop, blog, CMS pages, static routes |
| Products | `/sitemap/products.xml` | All published PDPs |
| Categories | `/sitemap/categories.xml` | `/shop/{slug}` category pages |
| Brands | `/sitemap/brands.xml` | `/brand/{slug}` pages |
| Blog | `/sitemap/blog.xml` | Published posts |
| Images | `/sitemap/images.xml` | Product page URLs with `image:image` entries |

Submit only `/sitemap.xml` to Google Search Console and Bing Webmaster Tools. Both engines follow the index automatically.

## Cache invalidation

On product publish/update/delete:

1. Next.js paths revalidated (`/products/{slug}`, `/shop`, `/`)
2. All sitemap segments and `/llms-full.txt` revalidated
3. IndexNow ping sent for changed product URL (when `INDEXNOW_KEY` is set)

Posts, pages, categories, and brands follow similar revalidation hooks.

## robots.txt policy

- **Allow:** all public storefront pages, `/api/ai/*`, `/llms.txt`, `/llms-full.txt`, merchant feed
- **Disallow:** admin, cart, checkout, account, wishlist, compare, generic `/api/` (except AI/feed paths allowed for bots)

AI crawlers (GPTBot, Google-Extended, anthropic-ai, PerplexityBot) get explicit Allow rules for machine-readable endpoints.

## Canonicalization

| Scenario | Behavior |
|----------|----------|
| Clean URL | Self-referencing canonical |
| Filtered shop (`?q=`, sort, brand filter) | `noindex, follow`; canonical = unfiltered path |
| Draft products | `noindex` |
| Private flows | `noindex` via `noindexMetadata` |

## IndexNow (Bing freshness)

1. Set `INDEXNOW_KEY` in environment (hex string, 8–128 chars)
2. Key file served at `https://{domain}/{INDEXNOW_KEY}.txt`
3. Product publishes trigger automatic ping to IndexNow API + Bing endpoint

## hreflang (future)

Single locale (`en-BD`) today. When Bengali or additional locales launch:

- Enable Payload localization
- Add `alternates.languages` in `generateMetadata` per route
- Segment sitemaps by locale or add `xhtml:link` hreflang entries

## Recommended submission timeline

| Day | Action |
|-----|--------|
| Pre-launch | Verify robots.txt and sitemap on staging with production URL |
| Launch | Submit sitemap in GSC + Bing; request indexing for homepage |
| Day 1–3 | Request indexing for top 20 PDPs and main categories |
| Week 1 | Review coverage report; fix any excluded URLs |
| Ongoing | Monitor crawl stats; expand GEO content for long-tail queries |
