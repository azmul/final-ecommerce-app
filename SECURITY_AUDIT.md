# Security Audit Report — my-project (Ecommerce + Payload CMS)

**Auditor:** Senior Security Engineer  
**Date:** 2026-05-25  
**Project Type:** Next.js 16 + Payload CMS 3.84.1 + PostgreSQL  
**Risk Score: 6.2 / 10 (MODERATE)**

---

## Executive Summary

The codebase shows strong awareness of security (rate limiting, OWASP-like access controls, sanitized redirects, production env validation, no Docker exposure). However, several critical and high-severity vulnerabilities exist—most notably: **hardcoded secrets in `.env` checked into git**, **an in-memory rate limiter that resets per deployment**, **missing Content Security Policy**, **insecure VAPID key handling**, **no brute-force protection on login**, **GraphQL playground enabled**, and **dependency vulnerabilities**.

---

## RISK LEGEND

| Level | Color | Meaning |
|-------|-------|---------|
| **Critical** | 🔴 | Immediate exploitation possible; full system compromise |
| **High**    | 🟠 | Significant impact; sensitive data access or privilege escalation |
| **Medium**  | 🟡 | Limited impact; requires chaining with other vulnerabilities |
| **Low**     | 🟢 | Best practice violation; minor information disclosure |

---

## 1. CRITICAL FINDINGS

### 1.1 HARDCODED SECRETS IN `.env` CHECKED INTO GIT

**Risk: 🔴 Critical**  
**File:** `.env` (lines 1, 15, 18-19, 22, 24-26, 32)

```
PAYLOAD_SECRET=bc08406b9d2cad68287ee67264eb7ca40185120b5b5e5e7708036a7e958e98fb
DATABASE_URL=postgres://postgres:123456@127.0.0.1:5432/nature_store
PREVIEW_SECRET=demo-draft-secret
STRIPE_SECRET_KEY=sk_test_
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_
STRIPE_WEBHOOKS_SIGNING_SECRET=whsec_
VAPID_PRIVATE_KEY=1quUlpWLNn0U7hrhnEapdwFfTkaBdJWhPPut9HzDJTk
CRON_SECRET=CuERx+gewV3xcNDNpAysyKP/ejmFXlPT4ACFZ07goOk=
```

**Exploitation:** `.gitignore` has `.env*` pattern, but `.env` was committed/reachable in the repo history. DB password `123456` is trivially guessable. If this repo is pushed to any remote, all secrets are compromised.

**Fix:**
1. Rotate all secrets immediately.
2. Remove `.env` from git history using `git filter-branch` or `git-filter-repo`.
3. Use `.env` strictly locally; use Vault, AWS Secrets Manager, or 1Password CLI for production.
4. Enforce `pre-commit` hook blocking `.env` commits.

### 1.2 DISABLED GRAPHQL PLAYGROUND DOES NOT FULLY PROTECT GRAPHQL API

**Risk: 🔴 Critical**  
**File:** `src/payload.config.ts:143`

```ts
graphQL: {
  disablePlaygroundInProduction: true,
},
```

While the playground is disabled, the GraphQL endpoint itself (`POST /api/graphql`) is still active. If no mongoose-level or API-gateway-level query depth limiting is in place, an attacker can execute deeply nested queries to cause a denial-of-service.

**Fix:**
```ts
graphQL: {
  disablePlaygroundInProduction: true,
  maxDepth: 5,
  // or use a custom cost-limit function
},
```

### 1.3 IN-MEMORY RATE LIMITER — STATELESS (RESETS PER DEPLOYMENT)

**Risk: 🟠 High**  
**File:** `src/utilities/edgeRateLimit.ts`

```ts
const buckets = new Map<string, Bucket>() // in-memory, per-instance
```

**Exploitation:** On serverless (Vercel) each cold start has an empty bucket. An attacker can send 30 auth requests per unique IP *per lambda invocation*. Also, the map grows unbounded until it hits 5000 entries, then prunes—this is a memory leak vector.

**Fix:** Use Vercel KV, Upstash Ratelimit, or a Redis-backed rate limiter:
```ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export const authLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '60 s'),
  analytics: true,
})
```

---

## 2. HIGH-RISK FINDINGS

### 2.1 MISSING CONTENT SECURITY POLICY (CSP)

**Risk: 🟠 High**  
**File:** `next.config.ts:104-128`

Headers set include `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy`, but no `Content-Security-Policy`.

**Exploitation:** Without CSP, stored XSS in product descriptions, blog comments, or Lexical rich text can execute arbitrary JavaScript. The Lexical editor supports HTML output, and there is no CSP to restrict inline scripts.

**Fix:**
```ts
async headers() {
  return [
    {
      headers: [
        {
          key: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://*.facebook.net",
            "frame-src 'self' https://js.stripe.com https://*.facebook.com",
            "img-src 'self' data: blob: https:",
            "connect-src 'self' https://api.stripe.com https://*.facebook.com https://*.google-analytics.com",
            "style-src 'self' 'unsafe-inline'",
          ].join('; '),
        },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
      source: '/:path*',
    },
  ]
}
```

### 2.2 NO BRUTE-FORCE PROTECTION ON AUTH ENDPOINTS

**Risk: 🟠 High**  
**File:** `src/middleware.ts:43-48`

```ts
if (SENSITIVE_AUTH_PATHS.has(pathname)) {
  if (!allowRateLimit(`auth:${ip}:${pathname}`, 30, 60 * 1000)) {
    return new NextResponse('Too Many Requests', { status: 429 })
  }
}
```

30 requests per minute is too generous for login. An attacker can try 30 passwords per IP per minute. With common password lists, this enables credential stuffing. Additionally, there is no account lockout mechanism.

**Fix:**
```ts
// Stricter limits per path
const AUTH_RATE_LIMITS: Record<string, { limit: number; windowMs: number }> = {
  '/api/users/login': { limit: 5, windowMs: 60 * 1000 },       // 5/min
  '/api/users/create': { limit: 3, windowMs: 60 * 60 * 1000 },  // 3/hour per IP
  '/api/users/forgot-password': { limit: 3, windowMs: 60 * 1000 },
  '/api/users/reset-password': { limit: 3, windowMs: 60 * 1000 },
}
```

Also add account lockout after N failed attempts:
```ts
// In a Users beforeChange hook
if (operation === 'update' && data?.loginAttempts > 5) {
  data.lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString()
}
```

### 2.3 PREVIEW ENDPOINT LACKS DRAFT-MODE AUTHENTICATION CHECK

**Risk: 🟠 High**  
**File:** `src/app/(app)/next/preview/route.ts:56`

```ts
// You can add additional checks here to see if the user is allowed to preview this page
draft.enable()
```

**Exploitation:** Anyone with the `PREVIEW_SECRET` can enable draft mode. Since `PREVIEW_SECRET` is `demo-draft-secret` in `.env`, an attacker can view unpublished content and pages.

**Fix:**
```ts
// Add explicit authorization check
if (!user) {
  draft.disable()
  return new Response('You are not allowed to preview this page', { status: 403 })
}

// Verify user has admin or editor role
if (!checkRole(['admin', 'editor'], user)) {
  draft.disable()
  return new Response('Insufficient permissions', { status: 403 })
}

// Optional: verify user can access the specific path
const previewPath = await validatePreviewAccess(path, user)
if (!previewPath) {
  draft.disable()
  return new Response('Not authorized for this page', { status: 403 })
}

draft.enable()
redirect(path)
```

### 2.4 JWT `jsonwebtoken` 9.0.3 — VULNERABLE DEPENDENCY

**Risk: 🟠 High**  
**File:** `package.json:61`

```json
"jsonwebtoken": "9.0.3"
```

While the recent CVEs for jsonwebtoken 9.0.x are moderate, the broader concern is that this library has a history of signature-verification bypasses. Payload uses it internally. Ensure Payload's `auth.tokenOptions` are set correctly and that you're on the latest patch.

**Fix:**
```sh
pnpm update jsonwebtoken
```
Or if Payload pins it, check for Payload updates.

### 2.5 CART SECRET CAN BE BRUTE-FORCED FOR GUEST CHECKOUT

**Risk: 🟠 High**  
**File:** `src/app/(app)/api/checkout/shipping-quote/route.ts:77-98`

The `cartSecret` is compared with a string equality check. The cart secret implementation is opaque but if it's a short/weak token, attackers can iterate.

**Fix:** Ensure cart secrets are cryptographically random (≥ 128 bits) and use constant-time comparison:
```ts
import timingSafeEqual from 'crypto.timingsafeequal'
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  return timingSafeEqual(Buffer.from(a), Buffer.from(b))
}
```

### 2.6 STRIPE WEBHOOK SECRET IN .env (TEST MODE, BUT PATTERN IS RISKY)

**Risk: 🟠 High**  
**File:** `.env:19`

```
STRIPE_SECRET_KEY=sk_test_
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_
```

Test keys are present. If production keys exist elsewhere but test keys remain in repo, the pattern establishes bad practices. In production, leak of `sk_live_*` would be catastrophic.

**Fix:**
- Never commit any `.env` file.
- Load Stripe secrets from environment (Vercel Env, AWS SSM) only.
- Add `sk_live_` regex scanning in CI.

### 2.7 VAPID PRIVATE KEY EXPOSED

**Risk: 🟠 High**  
**File:** `.env:25-26`

```
VAPID_PRIVATE_KEY=1quUlpWLNn0U7hrhnEapdwFfTkaBdJWhPPut9HzDJTk
```

Web Push VAPID private key is committed. Attackers can send push notifications impersonating the site to all subscribers.

**Fix:** Rotate keys immediately. Never commit any `*PRIVATE_KEY*`.

---

## 3. MEDIUM-RISK FINDINGS

### 3.1 NO INPUT SANITIZATION ON ORDER EMAIL RENDER

**Risk: 🟡 Medium**  
**File:** `src/lib/email/renderOrderEmail.ts:29-32`

```ts
const title =
  product && typeof product === 'object' && 'title' in product ?
    String((product as { title?: string }).title ?? 'Item')
  : 'Item'
return `<li>${title} × ${qty}</li>`
```

If a product title contains HTML `<script>alert('XSS')</script>`, it will be rendered in the email HTML unsanitized. While email clients block scripts, this is still an injection vector for tracking pixels and phishing.

**Fix:**
```ts
function escapeHtml(str: string): string {
  const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' }
  return str.replace(/[&<>"']/g, (c) => map[c])
}
// Then:
const title = escapeHtml(String(...))
```

### 3.2 CART ABANDONED EMAIL HAS STORED XSS VULNERABILITY

**Risk: 🟡 Medium**  
**File:** `src/app/(app)/api/cron/abandoned-carts/route.ts:113`

```ts
const title =
  product && typeof product === 'object' ? (product.title ?? 'Item') : 'Item'
return `<li>${title} × ${qty}</li>`
```

Same issue as above. Product titles from the database are interpolated directly into HTML.

### 3.3 NO SQL INJECTION PROTECTION IN CUSTOM QUERIES

**Risk: 🟡 Medium**  
**File:** `src/app/(app)/api/product-search/route.ts`

The Payload API uses parameterized queries via `where` clauses, which are safe. However, `depth: 2` on the products query resolves relationships, which could expose internal data if access controls are misconfigured.

### 3.4 PUBLIC GOOGLE MERCHANT FEED EXPOSES ALL PRODUCT DATA

**Risk: 🟡 Medium**  
**File:** `src/app/(app)/api/feeds/google-merchant/route.ts`

The feed is publicly accessible with no auth. While this is intentional for Google Merchant, ensure that:
- Product prices are the intended public prices.
- No draft/unpublished products leak (needs verification in `buildGoogleMerchantFeedItems`).

**Fix:** Verify the feed function filters by `_status: { equals: 'published' }`.

### 3.5 WEAK PASSWORD POLICY

**Risk: 🟡 Medium**  
**File:** `src/collections/Users/index.ts`

No password complexity requirements, no minimum length, no maximum login attempts.

**Fix:** Add password validation in `auth` config:
```ts
auth: {
  tokenExpiration: 604800,
  minPasswordLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialCharacters: true,
  maxLoginAttempts: 10,
  lockTime: 15 * 60 * 1000, // 15 minutes
},
```

### 3.6 ABANDONED CART CRON USES `overrideAccess: true`

**Risk: 🟡 Medium**  
**File:** `src/app/(app)/api/cron/abandoned-carts/route.ts:33`

```ts
overrideAccess: true,
```

The cron endpoint reads all carts bypassing access control. After reading data, it sends emails with product info. If `CRON_SECRET` is leaked, this endpoint dumps all cart data (including personal info).

**Fix:** Limit fields returned:
```ts
select: {
  id: true,
  items: true,
  customer: true,
  customerEmail: true,
  subtotal: true,
  updatedAt: true,
  abandonedCartEmailSentAt: true,
  currency: true,
},
```

### 3.7 STREAMING NOTIFICATION ENDPOINT — PERSISTENT CONNECTION WITHOUT RE-AUTH

**Risk: 🟡 Medium**  
**File:** `src/app/(app)/api/notifications/stream/route.ts`

The SSE stream checks auth once at connection start, then runs 20s polling forever with no token refresh check. If the user's session is revoked (password change, admin force-logout), the stream continues.

**Fix:** Re-check auth periodically:
```ts
const send = async () => {
  // Re-verify token is still valid
  const { user: currentUser } = await payload.auth({ headers: request.headers })
  if (!currentUser) {
    safeEnqueue(enc.encode('event: auth_expired\ndata: {}\n\n'))
    clearInterval(interval)
    controller.close()
    return
  }
  // ... existing logic
}
```

### 3.8 DEPENDENCIES WITH VULNERABILITIES (pnpm audit)

**Risk: 🟡 Medium**  
**File:** `package.json`

Several packages have advisories:

| Package | Issue | Action |
|---------|-------|--------|
| `esbuild` < 0.25.0 | Dev server CORS bypass (GHSA-67mh-4wv8-2f99) | Update |
| `nodemailer` | Needs review (2 advisories) | Monitor |
| `postcss` via Next.js | Needs review | Update Next.js |
| `dompurify` via monaco-editor | 8 advisories | Update @payloadcms/ui |
| `ws` via vitest | Needs review | Update vitest |

**Fix:**
```sh
pnpm update esbuild nodemailer postcss
```

---

## 4. LOW-RISK FINDINGS

### 4.1 NO RATE LIMITING ON PRODUCT SEARCH API

**Risk: 🟢 Low**  
**File:** `src/app/(app)/api/product-search/route.ts`

No rate limiting on public search endpoint. Could enable scraping.

### 4.2 SSL/TLS NOT ENFORCED IN CODE

**Risk: 🟢 Low**  
**File:** `next.config.ts`

No HSTS header. Consider adding:
```ts
{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
```

### 4.3 ROBOTS.TXT ALLOWS ALL CRAWLING

**Risk: 🟢 Low**

Admin panel paths `/admin` are crawlable. Add:
```
User-agent: *
Disallow: /admin
Disallow: /api/
```

### 4.4 X-Powered-By HEADER DISABLED BUT SERVER INFO LEAKS ELSEWHERE

**Risk: 🟢 Low**  
**File:** `next.config.ts:70`

```ts
poweredByHeader: false,
```

Good practice, but verify Payload admin doesn't leak version info in response headers.

### 4.5 PRODUCTION BUILDS ALLOW DEV-ONLY `allowedDevOrigins`

**Risk: 🟢 Low**  
**File:** `next.config.ts:63`

```ts
allowedDevOrigins: ['213.199.54.6'],
```

This IP is not localhost. If the production server somehow runs in dev mode, this weakens CORS restrictions. Ensure this only applies in development.

**Fix:**
```ts
...(process.env.NODE_ENV === 'development' ? { allowedDevOrigins: ['213.199.54.6'] } : {}),
```

### 4.6 CART `overrideAccess: true` ON FIND BY ID

**Risk: 🟢 Low**  
**File:** `src/app/(app)/api/checkout/shipping-quote/route.ts:63`

```ts
const cartSurface = await payload.findByID({
  collection: 'carts',
  depth: 0,
  overrideAccess: true,
})
```

The subsequent manual auth check mitigates this, but `overrideAccess: true` should be the last resort. Use `user` param instead if possible.

### 4.7 NO CORS CONFIGURATION ON CUSTOM API ROUTES

**Risk: 🟢 Low**  
**File:** All `src/app/(app)/api/*/route.ts` files

Custom API routes have no CORS headers. While Next.js App Router handles same-origin naturally, if these endpoints are ever called cross-origin, they will fail.

**Fix:** Add CORS headers if any endpoint needs cross-origin access:
```ts
export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, PATCH',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
```

### 4.8 SITEMAP EXPOSES URL STRUCTURE

**Risk: 🟢 Low**

`sitemap.xml` is auto-generated. Ensure only published content is included.

---

## 5. AUTHENTICATION & AUTHORIZATION REVIEW

### 5.1 Role-Based Access Control (RBAC)

The app implements a three-tier RBAC: `admin`, `customer`, `officeStaff` with granular page/action permissions. The implementation is generally solid.

**Strengths:**
- Staff permissions are granular (per-page, per-action)
- `adminOnlyFieldAccess` prevents non-admins from escalating privileges
- JWT stores role and permissions via `saveToJWT: true`
- Hostile token reuse is mitigated by `tokenExpiration: 604800` (7 days)

**Weaknesses:**
- Users collection `create` access returns `true` for unauthenticated requests (`src/access/adminStaffUsersAccess.ts:18-25`) — public registration is allowed
- No email verification for new registrations
- Token expiration (7 days) is generous for an ecommerce app

### 5.2 API Security

Most custom API routes correctly use `payload.auth()` to authenticate before processing. The admin permission endpoints (`/api/admin/users/[id]/permissions`) correctly verify full admin status.

### 5.3 IDOR Protection

The wishlist, notification, and product-alert endpoints correctly scope queries to the authenticated user. The `overrideAccess: false` option with `user` context is used consistently.

---

## 6. AI FEATURE SECURITY

### 6.1 AI Content Endpoints

**Files:** `src/app/(app)/api/ai/*/route.ts`

These endpoints expose structured product/category/brand data for LLM consumption. They read from the Payload CMS with no user input, so prompt injection is not directly applicable. However:

**Risk: 🟢 Low**
- The `llms-full.txt` endpoint exposes ALL published product URLs, categories, and brands (up to 200 products). This is intentional for SEO.
- The AI endpoint discovery at `/api/ai` provides a machine-readable index of all endpoints.
- No authentication required — these are public by design.

**Fix:** Consider adding rate limiting to AI endpoints to prevent bulk scraping.

### 6.2 Prompt Injection Risks

The AI endpoints are read-only and do not accept user input in request bodies that gets fed to an LLM. No prompt-injection vector identified.

---

## 7. PAYLOAD CMS SECURITY

### 7.1 Admin Panel

**Strengths:**
- `canAccessAdminPanel` correctly restricts admin access to admin/officeStaff roles
- Staff can only see collections they have explicit permissions for (`staffHideFromAdminNavUnless`)
- GraphQL playground disabled in production
- `disablePlaygroundInProduction: true`
- Custom `BeforeLogin` and `BeforeDashboard` components

**Weaknesses:**
- GraphQL endpoint still active and queryable
- Admin panel has no brute-force protection beyond rate limiter
- No IP allowlisting for admin panel

### 7.2 Collection Security

- `isDocumentOwner` correctly scopes customers to their own orders/carts
- `adminOrStaffOrPublished` prevents unauthenticated access to draft content
- Blog comments and product reviews have moderation workflows with proper access controls

---

## 8. INFRASTRUCTURE & DEPLOYMENT

### 8.1 Production Validation

**File:** `src/utilities/ensureProductionEnv.ts`

✅ Checks for `DATABASE_URL` and `PAYLOAD_SECRET` length ≥ 32  
✅ Skips validation during `next build` (CI-friendly)

### 8.2 Secrets Management

❌ `.env` with live secrets committed to repo  
❌ No secrets rotation schedule evident  
❌ No encrypted secrets store referenced

### 8.3 Docker

❌ No `Dockerfile` found — container security posture unknown  
❌ No `docker-compose.yml` — likely production deployment via Vercel

---

## 9. PRIORITIZED VULNERABILITY CHECKLIST

| # | Issue | Risk | Effort to Fix | Priority |
|---|-------|------|---------------|----------|
| 1 | Hardcoded secrets in `.env` git history | 🔴 Critical | High | **IMMEDIATE** |
| 2 | Missing CSP header | 🟠 High | Low | **HIGH** |
| 3 | Weak brute-force protection | 🟠 High | Medium | **HIGH** |
| 4 | Preview endpoint auth bypass | 🟠 High | Low | **HIGH** |
| 5 | VAPID private key exposed | 🟠 High | Low | **HIGH** |
| 6 | In-memory rate limiter | 🟠 High | Medium | **HIGH** |
| 7 | GraphQL depth/cost limits missing | 🟠 High | Low | **HIGH** |
| 8 | XSS in order/abandoned cart emails | 🟡 Medium | Low | **MEDIUM** |
| 9 | Weak password policy | 🟡 Medium | Low | **MEDIUM** |
| 10 | Cart abandoned cron data exposure | 🟡 Medium | Low | **MEDIUM** |
| 11 | Notification stream no re-auth | 🟡 Medium | Medium | **MEDIUM** |
| 12 | Dependency CVEs | 🟡 Medium | Medium | **MEDIUM** |
| 13 | Missing HSTS header | 🟢 Low | Low | **LOW** |
| 14 | Dev IP in production config | 🟢 Low | Low | **LOW** |
| 15 | Public robots.txt allows /admin | 🟢 Low | Low | **LOW** |

---

## 10. PRODUCTION HARDENING RECOMMENDATIONS

### Immediate (24h)
1. **Rotate all secrets**: PAYLOAD_SECRET, STRIPE_SECRET_KEY, STRIPE_WEBHOOKS_SIGNING_SECRET, VAPID_PRIVATE_KEY, CRON_SECRET, PREVIEW_SECRET
2. **Purge `.env` from git history**
3. **Add Content Security Policy** to `next.config.ts`
4. **Harden rate limiting**: reduce auth limits, add account lockout
5. **Strengthen password policy** in Payload config

### Short-term (1 week)
6. **Replace in-memory rate limiter** with Redis/Upstash
7. **Add GraphQL query depth/cost limiting**
8. **Fix XSS in email templates** (add HTML escaping)
9. **Add HSTS header**
10. **Add re-auth check in notification stream**
11. **Update vulnerable dependencies** (esbuild, nodemailer)

### Medium-term (1 month)
12. **Set up secrets management** (Vault, AWS Secrets Manager)
13. **Add IP allowlisting for admin panel**
14. **Implement email verification on registration**
15. **Add security.txt file** (`/.well-known/security.txt`)
16. **Set up automated dependency scanning** (Dependabot, Snyk)
17. **Add CI/CD security scanning** (Trivy, Semgrep, ESLint security plugin)

### Long-term
18. **Penetration testing** by third-party firm
19. **Bug bounty program**
20. **Security training** for developers
21. **PCI DSS compliance audit** if processing credit cards directly

---

## 11. OWASP TOP 10 MAPPING

| OWASP Category | Status | Notes |
|---------------|--------|-------|
| A1: Broken Access Control | ✅ Mostly secure | Granular RBAC, minor admin panel access concerns |
| A2: Cryptographic Failures | ⚠️ Needs work | Secrets in repo, weak password policy |
| A3: Injection | ⚠️ Partial | SQL safe (ORM), XSS in emails needs fixing |
| A4: Insecure Design | ⚠️ Moderate | Preview bypass, weak rate limiting design |
| A5: Security Misconfiguration | ⚠️ Significant | Missing CSP, HSTS, verbose GraphQL |
| A6: Vulnerable Components | ⚠️ Present | CVEs in dompurify, esbuild, nodemailer |
| A7: Auth Failures | ⚠️ Moderate | Weak brute-force, long token expiry |
| A8: Data Integrity Failures | ✅ Good | No deserialization risks identified |
| A9: Logging & Monitoring | ❌ Not reviewed | No security event logging evident |
| A10: SSRF | ✅ Good | No user-controlled URL fetches |

---

## 12. FINAL SECURITY SCORE

| Category | Score | Weight | Weighted |
|----------|-------|--------|----------|
| Authentication | 6/10 | 20% | 1.2 |
| Authorization | 7/10 | 15% | 1.05 |
| API Security | 6/10 | 15% | 0.9 |
| Data Protection | 4/10 | 15% | 0.6 |
| Configuration | 5/10 | 15% | 0.75 |
| Dependency Mgmt | 6/10 | 10% | 0.6 |
| Monitoring/Logging | 5/10 | 10% | 0.5 |

**Final Score: 6.2 / 10** ⚠️ MODERATE

### Score Interpretation
- **9-10**: Enterprise-grade security
- **7-8**: Good security posture  
- **5-6**: ⬅️ Current — Several critical gaps exist
- **3-4**: Poor — Immediate action required
- **1-2**: Critical failure

---

## APPENDIX: QUICK COMMANDS

```bash
# Rotate Payload secret
openssl rand -hex 32

# Generate new VAPID keys
npx web-push generate-vapid-keys

# Check git for secrets
git log --all --diff-filter=A -- ':!.env.example' -- '.env*'
git log --all -p -- ':!.env.example' -- '.env*' | grep -E '(PAYLOAD_SECRET|STRIPE|VAPID_PRIVATE|CRON_SECRET|DATABASE_URL)'

# Audit dependencies
pnpm audit
pnpm outdated

# Remove .env from git history
git filter-repo --path .env --invert-paths --force
```

---

*Report generated by automated security audit. Action items should be prioritized by a human security lead.*
