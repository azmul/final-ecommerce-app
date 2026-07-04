# Lighthouse Optimization Report

**Target scores (production):**

| Category | Target |
|----------|--------|
| Performance | ≥ 90 |
| SEO | 100 |
| Accessibility | ≥ 95 |
| Best Practices | ≥ 95 |

**Core Web Vitals targets:**

| Metric | Target |
|--------|--------|
| LCP | < 2.5s |
| INP | < 200ms |
| CLS | < 0.1 |

---

## Implemented optimizations

### Rendering

- Server Components for PDP, shop, category, brand, blog (full HTML on first byte)
- Static generation where possible; ISR via Payload revalidation hooks
- `dynamic()` imports for below-fold carousels, AR viewer, bundle offers

### Images

- `next/image` with AVIF + WebP (`formats: ['image/avif', 'image/webp']`)
- Responsive `deviceSizes` and `imageSizes` tuned for grid + PDP
- LCP image preload on PDP via `LcpImagePreload` + `extractLcpImageUrlFromProduct`
- Lazy loading for non-priority grid items
- `minimumCacheTTL: 86400` on optimized images
- CDN-ready via S3 remote patterns

### JavaScript

- `optimizePackageImports` for lucide-react, Radix, date-fns, embla
- Code splitting via `dynamic()` on heavy PDP sections
- Analytics scripts loaded `lazyOnload` (GA4/GTM/Meta)
- Deferred storefront widgets bundle

### Caching & compression

- `compress: true` in Next.js config
- Media API: `Cache-Control: public, max-age=86400, stale-while-revalidate=604800`
- Sitemap/llms-full revalidated on publish, not on every request

### SEO (Lighthouse audit)

- Unique `<title>` and meta description per route via `generateMetadata`
- Canonical URLs on all indexable pages
- Valid HTML lang attribute (`lang="en"`)
- Crawlable links (no JS-only navigation for primary routes)
- Tap targets and contrast via Tailwind design system

### Security headers (Best Practices)

- CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy
- `poweredByHeader: false`

---

## Audit procedure

Run against production URL (or staging with production-like data):

```bash
# CLI (requires npm i -g lighthouse)
lighthouse https://your-domain.com --only-categories=performance,seo,accessibility,best-practices --output html --output-path ./lighthouse-home.html

lighthouse https://your-domain.com/products/sample-slug --only-categories=performance,seo,accessibility,best-practices --output html --output-path ./lighthouse-pdp.html

lighthouse https://your-domain.com/shop/sample-category --only-categories=performance,seo,accessibility,best-practices --output html --output-path ./lighthouse-category.html
```

Or use Chrome DevTools → Lighthouse tab in incognito mode.

---

## Common remediation

| Issue | Fix |
|-------|-----|
| LCP slow on PDP | Verify LCP preload; reduce gallery JS; ensure hero image priority |
| CLS on shop grid | Set explicit aspect ratios on product cards |
| Unused JS | Audit dynamic imports; check third-party scripts |
| SEO score < 100 | Missing meta description, blocked robots, or non-crawlable links |
| Image delivery | Confirm AVIF/WebP; check oversized source uploads in CMS |

---

## Monitoring post-launch

- Google Search Console → Core Web Vitals report
- Chrome UX Report (CrUX) for field data
- Re-audit after major feature releases or catalog image bulk uploads

---

## Measured results — 2026-07-02 (local production build)

Conditions: `next build` + `next start` on a dev machine, Lighthouse 12.8.2,
headless Chrome, default simulated throttling (slow 4G / 4× CPU for mobile),
seed catalog content. Single runs — expect ±3–5 points of variance.

| Page | Perf (mobile) | Perf (desktop) | A11y | Best Practices | SEO |
|------|---------------|----------------|------|----------------|-----|
| Home | 82 | 99 | 100 | 100 | 100 |
| Shop | 77 | 99 | 100 | 100 | 100 |
| Product | 81 | 94 | 100 | 100 | 100 |
| Blog | 87 | 100 | 100 | 100 | 100 |

CLS ≤ 0.001 and TBT ≤ 170 ms on every page. Observed (unthrottled) LCP is
~200 ms; the mobile LCP figures (4.1–5.6 s) are Lighthouse's simulated
slow-4G estimate, dominated by total transfer weight, not by render blocking.

### Fixes applied in this pass (baseline mobile perf was 68–79, a11y 95–97)

1. Removed site-wide `Critical-CH` header injected by `withPayload` (re-scoped
   to `/admin`) — it forced Chrome to restart the first navigation on every
   page (~600 ms wasted on mobile, ~170 ms desktop).
2. Cookie consent banner now renders in the server HTML instead of appearing
   after hydration (it was literally the LCP element at 5.5–8.3 s); a
   synchronous inline script hides it pre-paint for returning visitors.
3. Removed `LcpImagePreload` raw-file preloads — they fetched the original
   multi-hundred-KB upload with `fetchPriority=high` that the page never
   displays, starving the real (already preloaded) `next/image` LCP request.
4. `Reveal` scroll animation and the shop grid entrance animation no longer
   SSR content at `opacity: 0`; above-the-fold content paints with the first
   HTML byte and only below-fold elements animate in.
5. GeistMono loads without preload (`next/font/local`, `display: swap`) —
   ~73 KB off the critical path; it is an accent font only.
6. Accessibility to 100: logo/price/label/button contrast (orange-500 and
   `text-primary/50` failed WCAG AA), footer heading order (h3→h2), app-store
   badge links named via `sr-only` text, cookie banner privacy link no longer
   prefetches a possibly-missing page (console error).

### To reach 90+ mobile performance (remaining, in impact order)

1. **Reduce JS transfer** — `unused-javascript` reports 84–186 KB per page.
   Candidates: audit framer-motion usage (LazyMotion features), defer the chat
   widget bundle until first interaction, split checkout/loyalty widgets off
   the AI-search page.
2. **Compress API JSON** — `/api/recommendations` ships ~40 KB uncompressed on
   shop; ensure route-handler responses are gzip/brotli encoded.
3. **Font subsetting** — Geist Sans variable woff2 is ~72 KB; a latin subset
   would roughly halve it (text LCP waits on font arrival in the simulation).
4. **CDN + HTTP/2** in production — the simulation assumes one origin over
   HTTP/1.1 locally; real deployments with a CDN edge and HTTP/2 multiplexing
   score materially higher than this local harness.

Re-run: `npx lighthouse https://<domain>/ --preset=desktop` and default
(mobile) after each deploy; keep results next to this file.
