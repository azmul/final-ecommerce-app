# Production-Readiness Audit

**Date:** 2026-07-02
**Stack:** Next.js 16 (App Router) · Payload CMS 3.85 · PostgreSQL + pgvector · Stripe + Cash on Delivery · Bangladesh market (BDT)
**Method:** Read-only exploration across security, e-commerce logic, architecture, testing, and DevOps. Critical and High findings were re-verified by direct code inspection.

---

## Executive summary

The platform is **substantially more complete than a typical pre-launch codebase.** The core commerce engine — catalog, variants, cart, guest checkout, multi-address, COD + Stripe, returns/refunds with Stripe integration and inventory restock, a full promo-code rules engine, inventory reservations backed by Postgres advisory locks, review moderation, loyalty/referrals, and GDPR export/delete — is implemented and coherent. TypeScript strict mode is on, Sentry and a health endpoint are wired, migrations are disciplined, and the README/docs are strong.

**Verdict: not yet production-ready, but close.** The blockers are a small number of concrete correctness and operational gaps, not architectural rework:

- a **promo-code redemption race condition** that is immediately exploitable,
- **no CI/CD**, while the repo carries known type errors and a broken linter,
- the **checkout / payment-webhook path has no automated tests**,
- **rate limiting is in-memory and applied to only 6 of many mutation endpoints.**

None require redesign. This report ranks every finding, gives file references, and lays out a three-phase roadmap. SEO, Core Web Vitals, PWA, mobile UX, PDP conversion, and AI-search accuracy were audited and fixed earlier in this engagement and are summarized (not re-opened) at the end.

---

## Findings at a glance

| # | Severity | Finding | Area |
|---|----------|---------|------|
| 1 | 🔴 Critical | Promo redemption race — limits bypassable | Security / Commerce |
| 2 | 🔴 Critical | No CI/CD; known tsc errors + broken lint ship silently | DevOps |
| 3 | 🔴 Critical | Checkout / payment-webhook path untested | Testing |
| 4 | 🟠 High | Rate limiting in-memory + only on 6 AI routes | Security / Scalability |
| 5 | 🟠 High | Weak password policy (8 chars) | Security |
| 6 | 🟠 High | Broad `overrideAccess: true` in custom API routes | Security |
| 7 | 🟠 High | `setImmediate` background work lost on serverless | Scalability |
| 8 | 🟠 High | Stripe refunds lack idempotency key | Payments |
| 9 | 🟡 Medium | Duplicated helpers (`fetchVariantsForProducts`, pricing) | Code quality |
| 10 | 🟡 Medium | God components (Checkout 1.4k lines, SalesDashboard 1.1k) | Code quality |
| 11 | 🟡 Medium | `console.*` logging in `src/proxy.ts` | Observability |
| 12 | 🟡 Medium | No VAT / tax modeling | Commerce |
| 13 | 🟢 Low | No Bangladesh payment gateways (bKash/Nagad/SSLCommerz) | Commerce (feature) |
| 14 | 🟢 Low | No invoice PDF generation | Commerce |
| 15 | 🟢 Low | Missing shipping/refund confirmation emails | Commerce |
| 16 | 🟢 Low | Guest chat cookie missing `HttpOnly`/`Secure` | Security |
| 17 | 🟢 Low | No Docker/compose; backup & DR undocumented | DevOps |
| 18 | 🟢 Low | High `as any` / `as unknown as` count (~214) | Code quality |

---

## 🔐 Security

### 1. 🔴 Promo-code redemption race condition
**Files:** [`src/collections/Orders/enrichOrderPromoFromCart.ts:89`](../src/collections/Orders/enrichOrderPromoFromCart.ts) · [`src/lib/promoCodes/validatePromoForCart.ts:125`](../src/lib/promoCodes/validatePromoForCart.ts)

Redemption limits (`maxRedemptionsTotal`, `maxRedemptionsPerUser`) are validated by reading a count, then `timesRedeemed` is bumped as a **read-modify-write** (`(promo.timesRedeemed ?? 0) + 1`). Two orders placed concurrently both read the old count, both pass validation, and both increment — so a capped or single-use code can be redeemed past its limit under trivial concurrency.

**Fix:** make the increment atomic and conditional — `UPDATE promo_codes SET times_redeemed = times_redeemed + 1 WHERE id = $1 AND times_redeemed < $max` and treat "0 rows updated" as "limit reached, reject the order." The codebase already has the right primitive for this: the Postgres advisory-lock pattern in [`src/lib/inventory/reservations.ts`](../src/lib/inventory/reservations.ts). Per-user limits need the same treatment against a per-user redemption record.

### 5. 🟠 Weak password policy
**File:** [`src/collections/Users/hooks/validatePasswordStrength.ts`](../src/collections/Users/hooks/validatePasswordStrength.ts)

Current rule: ≥ 8 characters, at least one letter, at least one digit — so `password1` passes. Raise the minimum to **12 characters**, require mixed case, and consider a blocklist of common passwords. Payload's built-in `maxLoginAttempts: 5` / `lockTime` lockout is already configured on the Users collection, which is good; strengthen the entropy floor to match.

### 6. 🟠 Broad `overrideAccess: true` in custom routes
**Examples:** [`src/app/(app)/api/admin/chat/conversations/route.ts`](<../src/app/(app)/api/admin/chat/conversations/route.ts>) · [`src/app/(app)/api/chat/conversations/[id]/messages/route.ts`](<../src/app/(app)/api/chat/conversations/[id]/messages/route.ts>)

Several custom API routes fetch with `overrideAccess: true`, bypassing Payload's ACL, then re-implement authorization manually downstream (e.g. `requireStaffPermissionApi()`, `loadConversationForParticipant()`). The current checks appear correct, but the pattern is fragile: deleting or reordering one guard silently exposes orders, conversations, or reviews to any caller. **Action:** inventory every `overrideAccess: true` in `src/app/**/api/**`, document why each is necessary, and move to Payload access-control functions where the built-in ACL can express the rule. Consider a lint rule flagging `overrideAccess` for mandatory review.

### 16. 🟢 Guest chat cookie flags
**File:** [`src/lib/chat/session.ts`](../src/lib/chat/session.ts)

The `chat_guest_session` cookie sets `SameSite=Lax` but not `HttpOnly` or `Secure`, so it is readable from JavaScript. Add both flags.

### Security posture that is already correct
`.gitignore` covers `.env*`; `.env.example` ships names only. Dependencies are current (Next 16.2, Payload 3.85, Stripe 22, React 19) with security-motivated `pnpm.overrides` for `nodemailer`, `undici`, `ws`, `fast-uri`. Raw SQL uses parameterized Drizzle `sql` templates with vector validation ([`src/lib/ai/embeddings.ts`](../src/lib/ai/embeddings.ts)). File uploads validate magic bytes and same-origin. Security headers + CSP are set in `next.config.ts` (note: `script-src` uses `'unsafe-inline'` to support Stripe/analytics — moving to nonces is a future hardening step).

---

## ⚡ Scalability & performance (server-side)

### 4. 🟠 Rate limiting is in-memory and narrow
**File:** [`src/lib/ai/rateLimit.ts`](../src/lib/ai/rateLimit.ts)

The limiter is a module-level `Map` — state is per-process, lost on restart, and **not shared across instances**, so any horizontal scaling (or serverless fan-out) lets an attacker multiply their allowance by the instance count. It is also applied to only **6 AI routes**. Unprotected mutation endpoints include:

- `api/chat/conversations` (conversation creation)
- `api/return-requests`
- `api/product-alerts`
- `api/product-reviews/[id]/helpful` (vote spam — authenticated but unthrottled)
- OAuth token-exchange routes

**Fix:** back the limiter with a durable store (Upstash/Redis) and apply it to all mutation endpoints via a shared wrapper, mirroring the existing `withAiPostHandler` pattern. The README already flags the in-memory limitation — this makes it a launch blocker rather than a note.

### 7. 🟠 `setImmediate` background work is serverless-fragile
**File:** [`src/lib/payload/deferTask.ts`](../src/lib/payload/deferTask.ts)

`deferTask` schedules work with `setImmediate` and no retry. On serverless, the function can return (and freeze/terminate) before the deferred task runs, so **embedding/RAG sync and AI SEO generation can silently never happen**, leaving search indexes stale. **Fix:** move durable work to a job queue (Payload Jobs, BullMQ) or the existing authenticated cron pattern ([`src/lib/cron/verifyCronAuth.ts`](../src/lib/cron/verifyCronAuth.ts)) with retry; at minimum, document that these tasks require a long-lived Node process, not serverless.

### Scalability that is already sound
Inventory decrement and reservations use `pg_advisory_lock` for correctness ([`src/lib/inventory/reservations.ts`](../src/lib/inventory/reservations.ts)). No in-process caches were found (safe to scale statelessly). Unbounded `payload.find` usage is limited to justified count-only queries and small fixed sets. Variant fetching batches (`limit: 500`) rather than N+1. A `/api/health` endpoint reports DB/memory/uptime for load-balancer probes.

---

## 💳 Payments

### 8. 🟠 Refunds lack an idempotency key
**File:** [`src/lib/payments/stripeRefundForOrder.ts`](../src/lib/payments/stripeRefundForOrder.ts)

`stripe.refunds.create(...)` is called without an `idempotency_key`. If the call succeeds at Stripe but the response is lost (network blip, retry), a second attempt issues a **duplicate refund**. **Fix:** pass a stable `idempotency_key` derived from the order + return-request ID.

### Payment flow that is already correct
The Stripe webhook handler verifies signatures (via the ecommerce plugin), COD is fully implemented with server-side inventory validation and order creation ([`src/plugins/cashOnDeliveryAdapter.ts`](../src/plugins/cashOnDeliveryAdapter.ts)), returns automatically trigger Stripe refunds + inventory restock + loyalty clawback ([`src/lib/returns/processReturnApproval.ts`](../src/lib/returns/processReturnApproval.ts)), and order totals/discounts are computed server-side, not trusted from the client. One follow-up: `stripeRefundForOrder` fails quietly with a `missing_intent` reason if the payment intent is absent — surface that as an alert rather than a silent log.

---

## 🛍️ E-commerce completeness

Most essentials exist. The gaps that matter:

### 12. 🟡 No VAT / tax modeling
There is no tax logic anywhere — no tax fields on products, no line in order totals. For a Bangladesh storefront, **15% VAT** is typically required. This needs a data model decision (tax-inclusive vs. exclusive pricing) before launch if VAT applies to the catalog.

### 13. 🟢 No Bangladesh payment gateways
Only Stripe + COD are wired. For the BD market, **bKash / Nagad / SSLCommerz** are the dominant rails and will materially affect conversion. This is a feature gap, not a defect — scope it deliberately.

### 14–15. 🟢 Invoice PDFs and email coverage
No invoice/receipt PDF generation. Transactional email covers order confirmation, abandoned cart, returns, and password reset, but **no shipping/delivery confirmation and no refund confirmation** email. The abandoned-cart email is AI-generated and skipped (logged only) if the LLM call fails — acceptable, but worth a fallback template.

### Complete and working
Orders lifecycle with status timeline and audit trail; guest checkout with secret-linked carts; multi-address; shipment-grouped shipping with district-based pricing; returns/refunds; promo engine (product/category restrictions, min-order, caps, per-user and total limits, first-time-only, email-domain rules); location-aware inventory with reservations; review moderation with verified-purchase checks; loyalty + referrals; wishlist; GDPR export/delete; hybrid (full-text + vector) search with faceted filters and infinite scroll; a sales dashboard, admin chat with order context, staff RBAC, risk assessment, and audit logs.

---

## 🏗️ Architecture & code quality

Structure is clean and domain-organized (`app` / `collections` / `components` / `lib` / `blocks` / `plugins` / `migrations`). TypeScript strict mode is enabled. The issues are localized:

### 9. 🟡 Duplication
- `fetchVariantsForProducts` is reimplemented in [`src/lib/ai/searchProducts.ts`](../src/lib/ai/searchProducts.ts), [`semanticSearch.ts`](../src/lib/ai/semanticSearch.ts), [`syncAllProductEmbeddings.ts`](../src/lib/ai/syncAllProductEmbeddings.ts), and `src/lib/search/hybridProductSearch.ts`. Extract one shared helper.
- Local `resolvePrice`/`resolvePricing` in `TopSellingProductCard.tsx`, `ProductQuickViewModal.tsx`, and `ProductGridItem.tsx` shadow the canonical [`src/lib/ecommerce/resolveProductPricing.ts`](../src/lib/ecommerce/resolveProductPricing.ts) — a real risk of divergent price math across the UI. Import the canonical function everywhere.

### 10. 🟡 God components
`src/components/checkout/CheckoutPage.tsx` (~1,445 lines) and `src/components/admin/SalesDashboardClient.tsx` (~1,117 lines) should be split into stage/sub-components for maintainability and testability.

### 18. 🟢 Type-assertion density
~214 `as any` / `as unknown as` casts, mostly bridging Payload's generated types. Not urgent, but a few sit in critical paths (`payload.db as unknown as ...` in reservations and health). Tighten opportunistically.

---

## 🧪 Testing

### 3. 🔴 The money path is untested
~47 tests exist (44 integration, 3 e2e) covering cart, chat, returns, search, AI, and access control — but the **highest-value flow has no coverage:**

- **checkout → order creation** (COD and Stripe)
- **Stripe webhook processing** (`src/plugins/index.ts`, webhook handler) — no idempotency/retry/out-of-order tests
- **promo-code validation** (zero tests, despite the race condition above)
- **inventory decrement under concurrency**

**Fix:** add integration tests for each before launch. These are the flows where a regression costs real money.

### Test infra that is already good
Vitest + Playwright are configured, e2e seeds a catalog first, `forbidOnly` is set for CI, and access-control has dedicated tests (`staffPermissions`, `staffNavAccess`).

---

## 🚀 DevOps & operations

### 2. 🔴 No CI/CD
There is no `.github/workflows/`. Nothing runs typecheck, tests, or build on merge — and the repo currently carries defects a pipeline would have caught:

- **2 pre-existing type errors** in [`tests/int/computeReturnRefundAmount.int.spec.ts:46,52`](../tests/int/computeReturnRefundAmount.int.spec.ts) (mock objects cast to `Order` / `ReturnRequest` without going through `unknown`).
- **`pnpm lint` is broken** — ESLint 10 is incompatible with the installed `eslint-plugin-react` 7.x, so linting cannot run at all.

**Fix:** add a GitHub Actions pipeline (lint → typecheck → vitest → build, plus a Playwright smoke job), fix the two type errors (`as unknown as Order`), and resolve the ESLint/plugin version conflict so the lint gate actually functions.

### 11. 🟡 Logging consistency
[`src/proxy.ts`](../src/proxy.ts) uses `console.warn`/`console.log` for request logging; everything else uses `payload.logger`. Route it through the structured logger so it reaches Sentry/aggregation.

### 17. 🟢 Docker & backup
No `Dockerfile`/`compose` for reproducible environments, and no documented backup/disaster-recovery procedure (daily `pg_dump` to S3 + PITR + a tested restore).

### Operations already in place
**Sentry is configured** (server/client/edge configs at repo root) and a **health endpoint exists** — so error monitoring is *not* a gap. What's missing is APM / uptime monitoring and slow-query logging. `.env.example` is comprehensive (186 lines) and the README is thorough.

---

## ✅ Already addressed earlier in this engagement

These areas were audited and fixed in prior sessions; they are **not** open items:

- **SEO / AEO / GEO** — sitemap index at `/sitemap.xml`, robots.txt allowances, blog ItemList JSON-LD, dedicated product SKU field + merchant-feed identifiers, Product/Organization/WebSite/Breadcrumb/FAQ structured data, llms.txt.
- **Core Web Vitals** — removed the site-wide `Critical-CH` header causing a same-URL 307 on every navigation; fixed the cookie banner being the LCP element; removed harmful raw-image preloads; stopped `opacity:0` SSR content in scroll animations; de-prioritized the mono font. Accessibility/Best-Practices/SEO at 100 on audited pages.
- **PWA** — installable manifest (correct icon set), hardened service worker (offline fallback, cache strategies, FIFO caps), automatic update checks.
- **Mobile UX** — removed floating-chrome overlaps on cards/checkout, enlarged sub-40px tap targets, safe-area insets.
- **PDP conversion** — restructured so title+price paint before the gallery on mobile, compact purchase panel, trust signals beside the CTA.
- **AI search accuracy** — fixed embedding index-alignment, attribute AND-filtering, filter-aware vector backfill, and chat-history ordering.

---

## Roadmap

### Phase 1 — Pre-launch blockers
1. Fix the **promo redemption race** (atomic conditional increment).
2. Stand up **CI/CD** (lint + typecheck + tests + build); fix the 2 tsc errors and the ESLint/plugin conflict.
3. Add **integration tests** for checkout, payment webhook, promo validation, and inventory decrement.
4. Move rate limiting to a **durable store** and apply it to **all mutation endpoints**.
5. Strengthen the **password policy**.
6. Add **refund idempotency keys**.

### Phase 2 — Hardening
1. Audit and document every `overrideAccess: true`; migrate to ACL where possible.
2. Move `deferTask` work to a **durable queue/cron**.
3. Model **VAT/tax** (if applicable to the catalog).
4. Add **shipping + refund confirmation emails**.
5. De-duplicate helpers; split the two god components.
6. Add **Docker/compose**, document **backup & DR**, add **APM/uptime** monitoring.
7. Route `proxy.ts` logging through `payload.logger`.

### Phase 3 — Growth
1. Integrate **Bangladesh payment gateways** (bKash / Nagad / SSLCommerz).
2. **Invoice PDF** generation.
3. Review-helpfulness UI + verified-purchase badges.
4. Analytics export (Mixpanel/Amplitude) and load testing / horizontal-scale validation.
5. CSP nonces to drop `'unsafe-inline'`; reduce type-assertion density.

---

## Appendix — what's genuinely strong

A disciplined migration history, server-side price/total computation, advisory-lock inventory correctness, a complete returns/refunds workflow, RBAC with audit logging, GDPR export/delete, hybrid search, thorough docs, current dependencies with security overrides, strict TypeScript, and Sentry + health checks. The remaining work is finishing and hardening a well-built system — not rebuilding one.
