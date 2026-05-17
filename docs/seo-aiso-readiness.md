# SEO, AEO & GEO Readiness Report

**Project:** Next.js 16 + Payload CMS 3 e-commerce  
**Last updated:** May 2026  
**Scope:** Traditional SEO, Answer Engine Optimization (AEO), Generative Engine Optimization (GEO), AI citation APIs

---

## 1. Executive summary

The storefront is configured for **crawlability** (Google + Bing), **rich structured data**, **machine-readable extraction** (AI APIs + `llms.txt`), and **editor-controlled GEO content** on products, categories, brands, and blog posts.

| Readiness area | Score | Notes |
|----------------|-------|-------|
| **Technical SEO** | 92% | Metadata, canonicals, unified sitemap, robots route, noindex on private flows |
| **Structured data** | 88% | Product, Offer, ratings, FAQ, ItemList, CollectionPage, BlogPosting, VideoObject, BreadcrumbList |
| **AEO / AI extraction** | 85% | `/api/ai/*`, `llms.txt`, `llms-full.txt`, `ai-summary` meta; content depends on CMS population |
| **Bing / Copilot / DDG** | 80% | SSR pages, single sitemap, robots allow; submit sitemap in Bing Webmaster Tools (manual) |
| **Trust & E-E-A-T** | 70% | Organization schema + env contact; author on posts; editorial policy pages optional |
| **Content GEO** | 60% | Fields exist; editors must fill AI & GEO tabs per SKU/category/post |

---

## 2. Architecture audit

| Layer | Technology |
|-------|------------|
| Framework | Next.js App Router (`src/app/(app)/`) |
| CMS | Payload 3 + Postgres |
| Commerce | `@payloadcms/plugin-ecommerce` (products, categories, cart) |
| SEO plugin | `@payloadcms/plugin-seo` (meta title/description, OG image) |
| Rendering | Server Components for PDP, shop, blog, brand |
| Images | `next/image` + Sharp |

### Public URL patterns

| Type | URL |
|------|-----|
| Product | `/products/{slug}` |
| Category | `/shop/{categorySlug}` |
| Brand | `/brand/{slug}` |
| Blog | `/blog/{slug}` |
| Shop index | `/shop` |

### Private / noindex routes

Cart, checkout, account, login, compare, wishlist (via `noindexMetadata`).

---

## 3. Implemented features

### 3.1 Structured data (JSON-LD)

| Schema | Where |
|--------|-------|
| Organization + WebSite + SearchAction | Root layout |
| Product, Offer, AggregateRating, FAQPage, BreadcrumbList | Product PDP |
| ItemList | Shop, category, brand listings |
| CollectionPage + BreadcrumbList + FAQPage | Category & brand pages (when GEO FAQs exist) |
| BlogPosting / HowTo + FAQPage + VideoObject | Blog post |
| FAQPage (standalone) | Taxonomy & blog when FAQs populated |

**Library:** `src/lib/seo/build*.ts`, `JsonLd.tsx`

### 3.2 Metadata

- Unique titles/descriptions via Payload SEO + fallbacks (`taxonomyMetadata`, `shopListingSeo`)
- Canonical URLs via `metadataBase` / `alternates.canonical`
- Open Graph + Twitter cards (Next metadata API)
- `other['ai-summary']` on listings and blog for AI-oriented snippets

### 3.3 Crawlability

| Resource | URL | Notes |
|----------|-----|-------|
| Sitemap | `/sitemap.xml` | Single file merging main, products, categories, brands, blog (image URLs included) |
| robots.txt | `/robots.txt` | Route handler; allows `/api/ai`, `/llms.txt`, `/llms-full.txt` for AI bots |
| Redirects | `redirects.ts` | 301/308 rules |

### 3.4 AI & machine-readable surfaces

| Endpoint | Purpose |
|----------|---------|
| `GET /llms.txt` | Curated site summary for LLM crawlers |
| `GET /llms-full.txt` | Live URL index from CMS (1h cache) |
| `GET /api/ai` | Discovery index of AI content endpoints |
| `GET /api/ai/products/[slug]` | Product facts, pricing, FAQs, related |
| `GET /api/ai/categories/[slug]` | Category overview, buying guide, FAQs |
| `GET /api/ai/brands/[slug]` | Brand overview, FAQs |
| `GET /api/ai/articles/[slug]` | Article summary, takeaways, FAQs |

**Library:** `src/lib/seo/aiContent.ts`

### 3.5 CMS — AI & GEO tabs

| Collection | Fields |
|------------|--------|
| Products | `aiSummary`, `keyFeatures`, `whyChooseThis`, `usageInfo`, `shippingReturnsNote`, `faqs` |
| Categories / Brands | `aiSummary`, `overview`, `buyingGuide`, `faqs` |
| Posts | `aiSummary`, `keyTakeaways`, `faqs`, `contentType` |

**Migrations:** `20260517_170000_seo_aiso_fields`, `20260517_190000_taxonomy_posts_geo`

### 3.6 Frontend GEO sections

- `ProductGeoSection` — PDP
- `TaxonomyGeoSection` — category & brand pages
- `BlogPostGeoSection` — blog posts

Semantic patterns: `<section>`, `<article>`, definition lists for FAQs, visible summaries for extraction.

### 3.7 Merchant feed

`GET /api/feeds/google-merchant` — XML for Google Merchant / Shopping surfaces.

### 3.8 Cache invalidation

On product/post publish: `revalidateSitemapAndLlms()` refreshes `/sitemap.xml` and `/llms-full.txt`.

---

## 4. File map

```
src/lib/seo/
  siteConfig.ts
  JsonLd.tsx
  buildOrganizationJsonLd.ts
  buildProductJsonLd.ts
  buildItemListJsonLd.ts
  buildBreadcrumbJsonLd.ts
  buildCollectionPageJsonLd.ts
  buildBlogJsonLd.ts
  resolveGeoContent.ts
  aiContent.ts
  sitemapData.ts
  buildRobotsTxt.ts
  merchantFeed.ts
  noindexMetadata.ts
  revalidateSitemap.ts
  cmsSeoFields.ts
  productSeoContentFields.ts
  taxonomyGeoContentFields.ts
  postGeoContentFields.ts

src/app/(app)/
  sitemap.ts
  robots.txt/route.ts
  llms.txt/route.ts
  llms-full.txt/route.ts
  api/ai/**/route.ts
  api/feeds/google-merchant/route.ts

src/components/seo/
  TaxonomyGeoSection.tsx
  BlogPostGeoSection.tsx

src/components/product/
  ProductGeoSection.tsx
```

---

## 5. Validation checklist

Production base URL must be set (`NEXT_PUBLIC_SERVER_URL`).

- [ ] [Google Rich Results Test](https://search.google.com/test/rich-results) — `/products/{slug}`
- [ ] [Schema Markup Validator](https://validator.schema.org/) — product + FAQ graphs
- [ ] [Bing Webmaster Tools](https://www.bing.com/webmasters) — submit `/sitemap.xml`
- [ ] [Google Search Console](https://search.google.com/search-console) — submit `/sitemap.xml`
- [ ] `curl -s $BASE/robots.txt` — plain text, sitemap line present
- [ ] `curl -s $BASE/sitemap.xml` — XML urlset (not redirect loop)
- [ ] `curl -s $BASE/api/ai/products/{slug}` — JSON with title, summary, keyFacts
- [ ] `curl -s $BASE/llms.txt` and `llms-full.txt` — 200
- [ ] View-source PDP — `application/ld+json` blocks present
- [ ] Cart/checkout — `robots: noindex` in metadata

---

## 6. Bulk GEO population (CLI)

Generate AI & GEO fields from product/category/post titles and metadata:

```bash
pnpm populate:geo          # canonical slugs only (skips ---copy duplicates)
pnpm populate:geo -- --all # every published row (up to limits)
pnpm populate:geo -- --force  # overwrite existing aiSummary
pnpm populate:geo -- --dry-run  # preview sample output
```

Logic lives in `src/lib/seo/geoContent/` and `src/endpoints/seed/populateGeoContent.ts`. Fresh database seeds also pre-fill Hat/Tshirt and main categories.

---

## 7. Editor playbook

### Products (highest ROI)

1. **AI summary** — 2–4 factual sentences (what it is, who it’s for, delivery region).
2. **Key features** — 5–8 bullets.
3. **Why choose this** — differentiation.
4. **FAQs** — 3–5 real questions (powers FAQPage schema + AI API).
5. **Shipping & returns** — policy snippet.

### Categories & brands

1. **Overview** — category/brand intro (100–200 words).
2. **Buying guide** — how to choose, sizing, materials.
3. **FAQs** — common category questions.

### Blog posts

1. Set **content type** (buying-guide, how-to, comparison, faq, trend).
2. **AI summary** at top; **key takeaways** as bullets.
3. **FAQs** for long-tail queries.

---

## 8. Remaining recommendations

| Priority | Item |
|----------|------|
| High | Populate AI & GEO fields for top 50 SKUs and main categories |
| High | Register site in Bing Webmaster Tools; submit sitemap |
| Medium | Dedicated About, Editorial policy, Returns policy pages linked in footer + Organization `sameAs` |
| Medium | Per-review `Review` schema nodes (optional; AggregateRating exists) |
| Medium | IndexNow ping on publish (Bing freshness) |
| Low | hreflang when Bengali or multi-locale launches |
| Low | Segmented public sitemaps (`/sitemap-products.xml`) if URL count exceeds 50k |
| Low | Author profile pages with `Person` schema linked from posts |

---

## 9. Environment variables

See `.env.example`:

- `NEXT_PUBLIC_SERVER_URL` — canonical base (required for sitemaps/APIs)
- `SITE_NAME`, `SITE_DESCRIPTION`, `SITE_LOCALE`, `SITE_CURRENCY`, `SITE_COUNTRY`
- `CONTACT_EMAIL`, `CONTACT_PHONE`, `SOCIAL_PROFILE_URLS`

---

## 10. Success criteria

| Criterion | Status |
|-----------|--------|
| Crawlable by Google & Bing | Yes (SSR + sitemap + robots) |
| Rich structured data | Yes (see §3.1) |
| Machine-readable summaries | Yes (`/api/ai/*`, llms files) |
| Trustworthy content structure | Partial (depends on CMS content) |
| AI citation readiness | Strong technical base; content population is the main lever |
