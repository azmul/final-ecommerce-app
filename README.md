# Store

This project is in **BETA**.

It is based on the official [Payload ecommerce template](https://github.com/payloadcms/payload/blob/3.x/templates/ecommerce). This repo includes a fully-working backend, enterprise-grade admin panel, and a production-ready ecommerce website.

Core features:

- [Authentication & Accounts](#authentication)
- [Access Control](#access-control)
- [Products & Variants](#products-and-variants)
- [Carts & Guest Checkout](#carts--guest-checkout)
- [Orders & Transactions](#orders-and-transactions)
- [Stripe Payments](#stripe)
- [AI Shopping Assistant](#ai-shopping-assistant)
- [Layout Builder](#layout-builder)
- [Draft & Live Preview](#draft-preview)
- [SEO](#seo)
- [Search](#search)
- [Security](#security)
- [Automated Tests](#tests)

## Quick Start

```bash
cp .env.example .env
pnpm install && pnpm dev
open http://localhost:3000
```

Follow the on-screen instructions to create your first admin user.

## Table of Contents

- [Authentication](#authentication)
- [Access Control](#access-control)
- [Products & Variants](#products-and-variants)
- [Carts & Guest Checkout](#carts--guest-checkout)
- [Orders & Transactions](#orders-and-transactions)
- [AI Shopping Assistant](#ai-shopping-assistant)
- [Chat Support](#chat-support)
- [Social Login](#social-login)
- [Product Reviews](#product-reviews)
- [Return Requests](#return-requests)
- [Loyalty & Referrals](#loyalty--referrals)
- [Layout Builder](#layout-builder)
- [Draft Preview](#draft-preview)
- [SEO](#seo)
- [Search](#search)
- [Security](#security)
- [Web Push (VAPID)](#web-push-vapid)
- [Cron Jobs](#cron-jobs)
- [Tests](#tests)
- [Development](#development)
- [Production](#production)

## Authentication

### Account Creation

Anyone can create a customer account at `/create-account` using either:
- Email + password
- Phone number (Bangladesh or India) — a synthetic email is generated for login

**Password requirements:** Minimum 8 characters, must include at least one letter and one number.

**Account lockout:** After 5 failed login attempts, the account is locked for 15 minutes.

Customers can log in with the same email or phone number used at signup — no email verification step.

### Password Reset

Password reset tokens are sent by email. The token is cleaned from the browser URL after page load to prevent leakage through browser history, referrer headers, and server logs.

### Order Lookup (Guest)

Guests can securely look up their orders at `/find-order` by providing their email and order ID. An access link is sent to their email — no credentials needed. The response is identical whether the order exists or not, preventing email enumeration.

## Access Control

Three roles: `admin`, `officeStaff`, `customer`.

- **Admin:** Full access to admin panel and all collections.
- **Office staff:** Granular per-page, per-action permissions managed through the admin panel.
- **Customer:** Can view their own orders, addresses, wishlist, notifications, and cart. Cannot access the admin panel.

Guest order access uses a unique `accessToken` (UUID) generated at order creation. Tokens expire after 7 days for guests. Logged-in users can access their own orders without time restrictions.

For details, see the [Payload Access Control](https://payloadcms.com/docs/access-control/overview) docs.

## Products & Variants

Products support variants (size, color, material), discount pricing, inventory tracking, stock locations, product alerts (back-in-stock notifications), and AI-generated SEO content. See the [ecommerce plugin](https://payloadcms.com/docs/ecommerce/plugin#products) docs.

## Carts & Guest Checkout

Carts work for both logged-in users and guests:

1. Guest adds items to cart (stored in localStorage + sessionStorage)
2. Cart persists through login — guest cart is linked to account
3. Checkout requires phone number (Bangladesh/India) or account login
4. Shipping quotes are calculated per district

Cart secrets use constant-time comparison to prevent timing attacks. See [resolveCheckoutCartAccess](./src/lib/carts/resolveCheckoutCartAccess.ts).

## Orders & Transactions

Orders are created after successful payment. Transactions track the payment lifecycle. Features:

- Cash on delivery (Bangladesh districts)
- Stripe payments
- Order confirmation emails (with HTML escaping)
- Order status tracking (processing → shipped → delivered)
- Fulfillment tracking
- Shipping summary stored with order

## AI Shopping Assistant

The chat widget (`/api/ai/assistant`) uses DeepSeek to help shoppers find products. Features:

- **Structured search:** Filter by name, category, brand, color, size, material, price range
- **Semantic search:** "comfortable tshirt for gym" → finds relevant products
- **Product comparison:** Compare up to 4 products side by side
- **Checkout tools:** Shipping quotes, promo code validation, loyalty balance lookup
- **Knowledge base search:** Store policies, FAQ, shipping/returns info
- **Personalized recommendations:** Homepage, product page, and cart recommendations

### AI Safety

- Prompt injection defenses — user input is treated as untrusted data, never as instructions
- User email addresses are stripped from LLM context before sending to the LLM
- Embedding vectors validated before PostgreSQL `::vector` casting
- All LLM and embedding API calls have 30-second timeouts
- AI query logs automatically deleted after 30 days
- Max 5 tool-call rounds per user message

### Configuration

```env
# Default: OpenRouter (free model). DeepSeek is used when DEEPSEEK_API_KEY is set.
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_MODEL=nvidia/nemotron-3-super-120b-a12b:free
# Nemotron free tier is slow (~35s). Default OpenRouter timeout is 120s.
# OPENROUTER_REQUEST_TIMEOUT_MS=120000

# Recommended production: DeepSeek chat + OpenAI embeddings
# DEEPSEEK_API_KEY=sk-...
# DEEPSEEK_BASE_URL=https://api.deepseek.com
# DEEPSEEK_MODEL=deepseek-chat

EMBEDDING_API_KEY=sk-...        # OpenAI (recommended) — required for semantic search + RAG
EMBEDDING_BASE_URL=https://api.openai.com/v1
EMBEDDING_MODEL=text-embedding-3-small
```

The assistant gracefully degrades if embeddings are unavailable — falls back to text-based search.

RAG uses Payload-style auto-sync: documents are chunked on save, embedded into Postgres pgvector (HNSW indexes), and kept in sync via `ragSyncPlugin`. Indexed sources include pages, posts, products, categories, subcategories, brands, and header/footer navigation.

**After deploy or first AI setup**, rebuild the full index (content chunks + product embeddings):

```bash
pnpm migrate
pnpm sync:rag
```

Or call the cron endpoint (same work as `pnpm sync:rag`):

```bash
curl -H "Authorization: Bearer $CRON_SECRET" "$NEXT_PUBLIC_SERVER_URL/api/cron/sync-knowledge-base"
```

On a dedicated Node server (not serverless), you can set `RAG_SYNC_ON_STARTUP=true` to re-index automatically on boot.

## Chat Support

Built-in live chat at `/admin/support` for staff to handle customer conversations. Customer chat persists across sessions — guest conversations merge into the user's account on login. Staff members with the `chat` permission can view and respond to customer conversations from the admin panel.

## Social Login

Google and Facebook OAuth are supported. Configuration:

```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
FACEBOOK_APP_ID=...
FACEBOOK_APP_SECRET=...
NEXT_PUBLIC_FACEBOOK_APP_ID=...
```

**Production requirement:** Set `OAUTH_DERIVATION_SECRET` to a random value (different from `PAYLOAD_SECRET`) to isolate OAuth account security:

```bash
openssl rand -hex 32
```

OAuth account linking from account settings requires a cryptographically random nonce cookie, preventing unauthorized linking from stolen sessions.

## Product Reviews

Customers can submit reviews only for products they've purchased (verified purchase check). Reviews go through moderation: a draft is created, staff reviews and approves it. Customers can edit rejected reviews. Review summaries (average rating, distribution) are synced automatically.

## Return Requests

Customers can request returns from the order detail page. Staff processes returns through the admin panel. Return requests support:
- Multiple return types (refund, replacement, store credit)
- Photo uploads (up to 3 images, 5 MB each)
- Return status tracking
- Customer notifications at each status change
- Loyalty point clawback on approved returns

## Loyalty & Referrals

### Loyalty Points

- Earn points on delivered orders (configurable rate)
- Redeem points at checkout for discounts
- Points expire or are clawed back on returns
- Balance shown in account dashboard

Configuration:
```env
LOYALTY_EARN_RATE=0.01          # Points per BDT spent
LOYALTY_POINT_VALUE_BDT=1       # 1 point = 1 BDT
LOYALTY_MIN_REDEEM=50           # Minimum points to redeem
```

### Referrals

Each user gets a unique referral code. When a referred user makes their first delivered order, the referrer earns reward points. Configuration:

```env
REFERRAL_REWARD_POINTS=200
```

## Layout Builder

Create unique page layouts with these blocks:

- Hero / Banner / Campaign Hero
- Content / Media / Code
- Call to Action
- Product Showcase / Top Selling Products / Exclusive Combo Deals
- Featured Categories / Brands Carousel / Category Product Showcase
- Carousel / Archive / Three Item Grid
- Testimonials / Trust Stats / Marketing Features
- FAQ / Form / Countdown Promo
- Campaign Banner Strip / Single Image Banner / Promo Carousel Split
- Focus Discount Product / Two Image Promo

## Draft Preview

Products and pages are draft-enabled with versioning. Use the `PREVIEW_SECRET` env var to secure draft preview access:

```env
PREVIEW_SECRET=...   # generate with: openssl rand -hex 16
```

Only admins and office staff can access draft previews. Regular users are denied.

## Payload Admin on VPS IP

Payload only accepts cookie-based admin auth from configured browser origins. If
the VPS is opened by IP instead of the production domain, set the public URL to
that exact origin or add it to the extra allowlist:

```env
NEXT_PUBLIC_SERVER_URL=http://203.0.113.10:3000
PAYLOAD_PUBLIC_SERVER_URL=http://203.0.113.10:3000
# Or, when NEXT_PUBLIC_SERVER_URL points at the domain:
ALLOWED_ORIGINS=http://203.0.113.10:3000,http://203.0.113.10
```

After changing these values on the server, rebuild and restart the app so the
admin client and Payload config agree on the same origin.

## SEO

- [Payload SEO Plugin](https://payloadcms.com/docs/plugins/seo) for meta tags, Open Graph, JSON-LD
- AI-generated SEO content for products and pages
- Geo-targeted content (Bangladesh-specific pages)
- Google Merchant Center feed at `/api/feeds/google-merchant`
- Sitemap, robots.txt, and `llms.txt` for AI crawlers
- Blog with categories, tags, comments, and related posts

## Search

- Server-side product search with category, brand, and attribute filters
- Infinite scroll shop with sorting
- Blog search at `/api/blog-search`
- AI-powered semantic and visual search

## Security

### Rate Limiting

The middleware applies per-path rate limits for POST requests:

| Path | Limit | Window |
|------|-------|--------|
| `/api/users/login` | 5 | 1 minute |
| `/api/users/forgot-password` | 3 | 1 minute |
| `/api/users/reset-password` | 3 | 1 minute |
| `/api/users` (register) | 3 | 1 hour |
| `/api/chat/conversations` | 30 | 1 minute |
| `/api/ai/assistant` | 20 | 1 minute |
| `/api/ai/compare` | 20 | 1 minute |
| `/api/ai/search-products` | 30 | 1 minute |
| `/api/ai/semantic-search` | 30 | 1 minute |
| `/api/ai/visual-search` | 10 | 1 minute |
| `/api/analytics/events` | 120 | 1 minute |
| `/next/seed` | 5 | 15 minutes |

When rate limit capacity is reached, requests are **denied** — expired buckets are evicted first. For production multi-instance deployments, replace the in-memory limiter with Upstash Ratelimit or Redis.

### Security Headers

Set for all routes:
- **Content-Security-Policy:** script-src, frame-src, connect-src restricted to known domains; object-src 'none'
- **HSTS:** max-age=63072000 (2 years); includeSubDomains; preload
- **X-Frame-Options:** SAMEORIGIN
- **X-Content-Type-Options:** nosniff
- **Referrer-Policy:** strict-origin-when-cross-origin
- **Permissions-Policy:** camera=(), microphone=(), geolocation=()

### Other Security Measures

- HTML escaping on all email templates (order confirmations, abandoned carts)
- Open redirect protection via `safeRedirectPath` (blocks absolute URLs, protocol-relative, null bytes, backslashes)
- Cart secret constant-time comparison
- Stripe webhook signature verification
- GraphQL introspection and playground disabled in production; max complexity limit of 100
- `X-Powered-By` header disabled

For a complete security audit, see [SECURITY_AUDIT.md](./SECURITY_AUDIT.md).

## Web Push (VAPID)

Generate keys:

```bash
npx web-push generate-vapid-keys
```

Add to `.env`:
```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<public>
VAPID_PUBLIC_KEY=<same public>
VAPID_PRIVATE_KEY=<private>
VAPID_SUBJECT=mailto:admin@example.com
```

Push notifications deliver product alerts (back-in-stock, price drops) and admin broadcasts. Inbox notifications work without VAPID.

## Cron Jobs

Protected by `CRON_SECRET`. All cron endpoints require `Authorization: Bearer <CRON_SECRET>`.

Generate a random secret:
```bash
openssl rand -base64 32
```

Add to `.env`:
```env
CRON_SECRET=...
```

### Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /api/cron/notifications` | Process scheduled notification broadcasts |
| `GET /api/cron/abandoned-carts` | Send abandoned cart emails (24h inactive, marketing opted-in) |
| `GET /api/cron/sync-knowledge-base` | Index pages and FAQs into AI knowledge base |
| `GET /api/cron/product-affinity` | Compute product co-purchase affinity |
| `GET /api/cron/subscriptions` | Process subscription renewals |

## Tests

```bash
pnpm test:int      # Vitest integration tests
pnpm test:e2e      # Playwright end-to-end tests
pnpm test          # Both
```

## Development

### Local Postgres

The adapter uses `push: false` with explicit migrations. After schema changes:

```bash
pnpm payload migrate:create   # create migration
pnpm payload migrate          # apply migrations
```

### Seed

Click "Seed database" in the admin panel to populate sample data. Creates a demo customer (`customer@example.com` / `password`).

### Environment Variables

Copy `.env.example` to `.env` and fill in required values. See `.env.example` for all available options including Stripe, analytics, SMS/WhatsApp, email, Cloudflare R2 storage, and more.

## Production

```bash
pnpm build
pnpm payload migrate
pnpm start
```

### Vercel

Use `@payloadcms/db-vercel-postgres` and `@payloadcms/storage-vercel-blob` for Vercel deployments.

## Questions

[Discord](https://discord.com/invite/payload) · [GitHub Discussions](https://github.com/payloadcms/payload/discussions)
