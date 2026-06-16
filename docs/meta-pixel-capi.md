# Meta Pixel + Conversions API (CAPI)

Server-side rendering–safe Facebook/Meta tracking for this Next.js 16 + Payload CMS storefront.

## Architecture

```text
Browser (Meta Pixel)                Server (Conversions API)
─────────────────────               ─────────────────────────
AnalyticsScripts                    /api/analytics/meta
  └─ fbq init (lazyOnload)            └─ sendMetaCapiEvent + retry
MetaPixelProvider
  └─ PageView on route change       /api/analytics/purchase
useAnalyticsEvent / trackStoreEvent     └─ Purchase + GA4 MP (deduped)
  ├─ fbq track + eventID
  └─ POST /api/analytics/meta
```

Every funnel event uses a shared `event_id` on the browser (`eventID` option) and server (`event_id` field) so Meta deduplicates paired events.

## Environment variables

| Variable | Scope | Required | Description |
|----------|-------|----------|-------------|
| `NEXT_PUBLIC_META_PIXEL_ID` | Client | Yes* | Pixel ID for browser `fbq` |
| `META_PIXEL_ID` | Server | Recommended | CAPI pixel ID (falls back to public ID) |
| `META_CAPI_ACCESS_TOKEN` | Server | Yes* | Events Manager system user token |
| `META_TEST_EVENT_CODE` | Server | Dev | Test Events tool code |
| `META_DEBUG=1` | Server/Client | Dev | Verbose `[meta:*]` console logs |

\*Tracking is skipped gracefully when unset.

Add to `.env`:

```env
NEXT_PUBLIC_META_PIXEL_ID=123456789012345
META_PIXEL_ID=123456789012345
META_CAPI_ACCESS_TOKEN=EAA...
META_TEST_EVENT_CODE=TEST12345
```

## Event lifecycle

| Store event | Meta event | Trigger |
|-------------|------------|---------|
| `page_view` | PageView | `MetaPixelPageViewTracker` on pathname/search change |
| `product_view` | ViewContent | `ProductViewBeacon` on PDP mount |
| `search` | Search | Header search submit + shop `?q=` page |
| `add_to_cart` | AddToCart | `AddToCart` after cart API success |
| `begin_checkout` | InitiateCheckout | `CheckoutBeginBeacon` on checkout mount |
| `add_payment_info` | AddPaymentInfo | `AddPaymentInfoBeacon` at review step |
| `purchase` | Purchase | `PurchaseEventBeacon` on order confirmation |
| `lead` | Lead | `ProductQuoteRequest` form success |
| `complete_registration` | CompleteRegistration | `CreateAccountForm` success |

### Purchase funnel

```text
ViewContent → AddToCart → InitiateCheckout → AddPaymentInfo → Purchase
```

Purchase payloads include product ID (slug), name, category, quantity, price, currency, value, and order ID.

## Enhanced matching (server)

CAPI `user_data` is populated when available:

- `em` — SHA-256 hashed email
- `ph` — SHA-256 hashed phone (digits only)
- `client_ip_address` — from `x-forwarded-for` / `x-real-ip`
- `client_user_agent` — request header
- `external_id` — logged-in user ID or `analytics_client_id` localStorage value
- `fbp` / `fbc` — Meta cookies from browser relay

## SSR & client navigation

- Pixel bootstrap loads with `next/script` `strategy="lazyOnload"` for Core Web Vitals.
- Initial `PageView` is **not** fired in the bootstrap script; `MetaPixelPageViewTracker` owns all page views to avoid hydration duplicates.
- Route transitions update `usePathname` + `useSearchParams`; duplicate paths are ignored via a ref.

## Validation

### Meta Pixel Helper (browser extension)

1. Set `NEXT_PUBLIC_META_PIXEL_ID`.
2. Run `pnpm dev`, open storefront.
3. Pixel Helper should show `PageView` after navigation.
4. Add to cart / checkout — verify standard events.

### Test Events (Events Manager)

1. Copy **Test event code** from Events Manager → Test events.
2. Set `META_TEST_EVENT_CODE` in `.env`.
3. Restart dev server.
4. Perform funnel actions — events appear in Test Events with `test_event_code`.

### Debug logging

```env
META_DEBUG=1
```

Logs `[meta:pixel]`, `[meta:capi]`, `[meta:track]`, `[meta:pageview]` to the console in development (or when `META_DEBUG=1`).

## Code map

| Path | Role |
|------|------|
| `src/components/analytics/AnalyticsScripts.tsx` | Pixel + GA bootstrap |
| `src/components/analytics/MetaPixelProvider.tsx` | SPA PageView tracker |
| `src/lib/analytics/trackStoreEvent.ts` | Client dual-fire helper |
| `src/lib/analytics/meta/capi.ts` | CAPI sender with retry |
| `src/lib/analytics/meta/client.ts` | `fbq` wrapper |
| `src/hooks/useAnalyticsEvent.ts` | React hook (Meta + internal DB) |
| `src/app/(app)/api/analytics/meta/route.ts` | CAPI relay |
| `src/app/(app)/api/analytics/purchase/route.ts` | Purchase + GA4 MP |

## Security

- Access token and test event code are **server-only** env vars.
- PII is hashed before CAPI (email/phone); raw values are never sent to Meta from the client relay except to your own API over HTTPS.
- Purchase CAPI requires order ownership (logged-in customer or guest `accessToken`).

## Performance

- Scripts use `lazyOnload` — no render-blocking Meta/GA tags.
- Analytics failures are swallowed; UX is never blocked.
- CAPI retries up to 3 times on 429/5xx with exponential backoff.
