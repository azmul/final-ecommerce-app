# SEO & AI Search (AISO/GEO) Readiness Report

**Project:** Next.js + Payload CMS e-commerce  
**Date:** May 2026  
**Scope:** Technical SEO, structured data, sitemaps, GEO content, merchant feeds, AI crawler support

---

## 1. Executive summary

The store had a **solid SEO baseline** (Next.js metadata, Payload SEO plugin, single sitemap, product JSON-LD). This implementation closes the highest-impact gaps for **AI-powered search** (ChatGPT, Gemini, Claude, Perplexity) and **traditional rich results**, with segmented sitemaps, expanded Schema.org coverage, GEO product content in CMS, `llms.txt`, and a Google Merchant XML feed.

---

## 2. Audit — what existed vs. gaps

| Area | Before | After |
|------|--------|-------|
| Product JSON-LD | `ProductJsonLd` via next-seo | Full `Product` + `Offer` + `AggregateRating` + `FAQPage` |
| Site JSON-LD | `Organization` only | `Organization` + `WebSite` + `SearchAction` |
| Listing pages | No ItemList | `ItemList` on shop, category, brand |
| Sitemaps | Single `/sitemap.xml` | Segmented: main, products, categories, brands, blog, images |
| robots.txt | Basic allow/disallow | Private routes blocked; AI bots; multi-sitemap refs |
| AI crawlers | None | `/llms.txt` |
| Merchant feed | None | `/api/feeds/google-merchant` |
| Product GEO content | Description only | CMS tab: summary, features, FAQs, shipping, usage |
| Category/brand SEO | Code-generated only | Payload SEO meta tab |
| Private pages | Often indexable | `noindex` on cart, checkout, account, login, compare |
| Blog content types | Generic posts | `contentType` field (buying guide, comparison, etc.) |

### Remaining recommendations (not implemented)

- **hreflang / i18n** — site is English-only (`lang="en"`); add when Bengali or other locales ship.
- **Subcategory index URLs** — subcategories use `?sub=` query params (correctly `noindex` when filtered).
- **Individual Review schema** — reviews are in `AggregateRating`; per-review `Review` nodes optional.
- **Sitemap revalidation** — wire `revalidateTag` on product/category publish (tags exist but were commented).
- **Content population** — editors must fill **AI & GEO** fields per product for maximum AI visibility.

---

## 3. Implementation map

| Deliverable | Location |
|-------------|----------|
| Site config | `src/lib/seo/siteConfig.ts` |
| JSON-LD helpers | `src/lib/seo/buildProductJsonLd.ts`, `buildOrganizationJsonLd.ts`, `buildItemListJsonLd.ts` |
| `JsonLd` component | `src/lib/seo/JsonLd.tsx` |
| Segmented sitemaps | `src/app/(app)/sitemap.ts` + `src/lib/seo/sitemapData.ts` |
| robots.txt | `src/app/(app)/robots.ts` |
| llms.txt | `src/app/(app)/llms.txt/route.ts` |
| Merchant feed | `src/app/(app)/api/feeds/google-merchant/route.ts` |
| Product GEO UI | `src/components/product/ProductGeoSection.tsx` |
| CMS: product GEO | `src/lib/seo/productSeoContentFields.ts` → Products collection |
| CMS: taxonomy SEO | `src/lib/seo/cmsSeoFields.ts` → Categories, Brands |
| CMS: blog types | `contentType` on Posts |
| noindex helper | `src/lib/seo/noindexMetadata.ts` |

---

## 4. Validation checklist

Run after deploy with production `NEXT_PUBLIC_SERVER_URL`:

- [ ] [Google Rich Results Test](https://search.google.com/test/rich-results) — `/products/{slug}`
- [ ] [Schema Markup Validator](https://validator.schema.org/) — product + FAQ graphs
- [ ] [PageSpeed Insights](https://pagespeed.web.dev/) — Core Web Vitals
- [ ] Google Search Console — submit sitemap index `/sitemap.xml`
- [ ] Verify `/llms.txt` and `/api/feeds/google-merchant` return 200
- [ ] Confirm cart/checkout/account return `noindex` in HTML
- [ ] Spot-check `ItemList` on `/shop`, `/shop/{category}`, `/brand/{slug}`

---

## 5. Editor playbook (GEO content)

For each product, complete the **AI & GEO** tab:

1. **AI summary** — 2–4 factual sentences (category, material, use case, Bangladesh delivery).
2. **Key features** — bullet list for scanners and AI extraction.
3. **Why choose this** — differentiation vs. alternatives.
4. **FAQs** — 3–5 real customer questions (feeds `FAQPage` schema).
5. **Shipping & returns** — clear policy snippet.

Example queries to target:

- “Best men's night dress in Bangladesh”
- “Where to buy women's pajamas online Bangladesh”
- “Affordable nightwear BDT”

---

## 6. Environment variables

See `.env.example` for optional:

- `SITE_DESCRIPTION`, `SITE_LOCALE`, `SITE_CURRENCY`, `SITE_COUNTRY`
- `CONTACT_EMAIL`, `CONTACT_PHONE`, `SOCIAL_PROFILE_URLS`

---

## 7. Success criteria status

| Criterion | Status |
|-----------|--------|
| Product schema with BDT, availability, ratings | Done |
| FAQ schema on products with CMS FAQs | Done |
| Dynamic metadata + AI summary meta | Done |
| Segmented XML sitemaps + image URLs | Done |
| robots.txt optimized | Done |
| GEO content structure | Done (CMS + frontend) |
| Internal linking (related products, brands, categories) | Existing + enhanced listings |
| Merchant feed | Done |
| Trust signals (Organization, contact env) | Done (configure env) |
| Multilingual | Not applicable yet |
| Performance | Existing Next/image + compress; monitor via Lighthouse |
