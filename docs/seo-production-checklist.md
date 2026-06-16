# SEO / AEO / GEO — Production Deployment Checklist

Use this checklist before and immediately after launch.

## Environment

- [ ] `NEXT_PUBLIC_SERVER_URL` set to production HTTPS URL (no trailing slash)
- [ ] `SITE_NAME`, `SITE_DESCRIPTION`, `SITE_LOCALE`, `SITE_CURRENCY`, `SITE_COUNTRY` configured
- [ ] `CONTACT_EMAIL`, `CONTACT_PHONE`, `SOCIAL_PROFILE_URLS` set for Organization schema
- [ ] `GOOGLE_SITE_VERIFICATION` and/or `BING_SITE_VERIFICATION` meta tokens set
- [ ] `INDEXNOW_KEY` generated (8–128 hex chars) and key file reachable at `/{key}.txt`
- [ ] `NEXT_PUBLIC_GA_MEASUREMENT_ID` or `NEXT_PUBLIC_GTM_ID` configured
- [ ] Meta Pixel + CAPI tokens set if running paid social

## Crawlability

- [ ] `curl -s $BASE/robots.txt` — sitemap line present, private paths disallowed
- [ ] `curl -s $BASE/sitemap.xml` — sitemap index listing segment files
- [ ] `curl -s $BASE/sitemap/products.xml` — product URLs present
- [ ] `curl -s $BASE/sitemap/categories.xml` — category URLs present
- [ ] `curl -s $BASE/sitemap/images.xml` — image entries for product pages
- [ ] `curl -s $BASE/llms.txt` and `llms-full.txt` — 200 OK
- [ ] Cart, checkout, account pages return `noindex` in metadata

## Structured data

- [ ] [Google Rich Results Test](https://search.google.com/test/rich-results) — sample PDP passes Product + Offer
- [ ] FAQPage schema on PDP/category when GEO FAQs populated
- [ ] BreadcrumbList on PDP, shop, category, brand pages
- [ ] Organization + WebSite + SearchAction on homepage

## AI / GEO surfaces

- [ ] `curl -s $BASE/api/ai/products/{slug}` — JSON with title, summary, keyFacts
- [ ] `curl -s $BASE/api/feeds/google-merchant` — valid XML feed
- [ ] Top 50 SKUs have AI & GEO tabs populated (`pnpm populate:geo`)
- [ ] Main categories have overview, buying guide, FAQs

## Search Console & Bing

- [ ] Property verified in [Google Search Console](https://search.google.com/search-console)
- [ ] Property verified in [Bing Webmaster Tools](https://www.bing.com/webmasters)
- [ ] Submit `/sitemap.xml` in both consoles
- [ ] Request indexing for homepage and top 10 PDPs

## Analytics

- [ ] GA4 Realtime shows page views
- [ ] GA4 DebugView shows `view_item`, `add_to_cart`, `begin_checkout`, `purchase` events
- [ ] Meta Events Manager shows Pixel + CAPI deduplicated events
- [ ] Server-side purchase fires on order confirmation

## Performance (Lighthouse)

- [ ] Homepage: Performance ≥ 90, SEO 100, Accessibility ≥ 95
- [ ] PDP: LCP < 2.5s, CLS < 0.1
- [ ] Images served as AVIF/WebP via `next/image`

## Trust & E-E-A-T

- [ ] About, Returns, Privacy, Contact pages published and linked in footer
- [ ] Organization `sameAs` social URLs in env
- [ ] Blog posts have author attribution

## Post-launch (week 1)

- [ ] Monitor Search Console coverage and crawl stats
- [ ] Fix any rich result warnings
- [ ] Review IndexNow pings in server logs after product publishes
- [ ] Expand GEO content to remaining catalog
