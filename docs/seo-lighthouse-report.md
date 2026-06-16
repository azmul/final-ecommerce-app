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
