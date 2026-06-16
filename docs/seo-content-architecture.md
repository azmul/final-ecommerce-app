# Content Architecture for SEO, AEO & GEO

## Page templates

| Template | URL | Primary schema | GEO content |
|----------|-----|----------------|-------------|
| Homepage | `/` | WebSite, Organization | CMS blocks |
| Product PDP | `/products/{slug}` | Product, Offer, AggregateRating, Review, FAQPage, BreadcrumbList | AI summary, features, FAQs |
| Category | `/shop/{slug}` | CollectionPage, ItemList, FAQPage, BreadcrumbList | Overview, buying guide, FAQs |
| Brand | `/brand/{slug}` | CollectionPage, ItemList, FAQPage, BreadcrumbList | Overview, FAQs |
| Shop index | `/shop` | ItemList | — |
| Blog post | `/blog/{slug}` | BlogPosting/HowTo, FAQPage, VideoObject | AI summary, takeaways, FAQs |
| CMS page | `/{slug}` | WebPage, FAQPage (if FAQ block) | Blocks + FAQ block |
| FAQ page | `/faq` | FAQPage | CMS content |

## Heading hierarchy

Every indexable page follows:

1. **H1** — one per page, matches primary intent (product name, category name, article title)
2. **H2** — major sections (features, specs, related products, buying guide)
3. **H3** — subsections within tabs or GEO blocks

Screen-reader-only H1 used where visual title is styled differently (brand pages).

## Entity structure (product knowledge graph)

Each product entity includes:

| Field | Source | AI/SEO use |
|-------|--------|------------|
| Brand | `product.brand` | Schema `brand`, feed attribute |
| Category | `product.categories` | Breadcrumb, ItemList context |
| SKU | product slug | Schema `sku` |
| Price / availability | variants + inventory | Offer schema, merchant feed |
| Images | gallery + meta | Image sitemap, OG tags |
| Reviews | approved reviews | AggregateRating + Review nodes |
| FAQs | CMS GEO tab | FAQPage schema, `/api/ai/products` |
| AI summary | CMS GEO tab | Meta description fallback, `ai-summary` meta |

## AEO content patterns

Answer engines extract from:

- **Short answer blocks** — `aiSummary` at top of PDP/category/blog (2–4 sentences)
- **Definition lists** — FAQ sections use `<dl>` / `<details>` with visible Q&A
- **Structured lists** — key features, takeaways, buying guide bullets
- **Semantic HTML** — `<article>`, `<section>`, `<nav aria-label="Breadcrumb">`

## GEO / AI discovery

| Surface | Format | Consumers |
|---------|--------|-----------|
| `/llms.txt` | Curated markdown | LLM crawlers |
| `/llms-full.txt` | Live URL index | LLM crawlers |
| `/api/ai/*` | JSON entity APIs | ChatGPT Search, Perplexity, agents |
| `/api/feeds/google-merchant` | XML | Google Shopping |
| `other['ai-summary']` meta | Plain text snippet | AI Overviews |

## Content types (blog)

Set `contentType` on posts for schema selection:

- `article` → BlogPosting
- `how-to` → HowTo
- `faq` → FAQPage + BlogPosting
- `buying-guide`, `comparison`, `trend` → BlogPosting with section tag

## E-E-A-T signals

| Signal | Implementation |
|--------|----------------|
| Experience | Product reviews, user-generated content |
| Expertise | Buying guides, how-to posts, category guides |
| Authoritativeness | Organization schema, brand pages, consistent NAP |
| Trustworthiness | Contact info, policies, secure checkout, visible returns |

## Population priority

1. Top 50 revenue SKUs — full GEO tab
2. All L1 categories — overview + buying guide + 3 FAQs
3. Top 20 brands — overview + FAQs
4. 10 cornerstone blog posts — buying guides / comparisons
5. Remaining catalog — batch via `pnpm populate:geo`
