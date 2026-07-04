import { SITEMAP_SEGMENT_IDS } from '@/lib/seo/sitemapData'
import { getServerSideURL } from '@/utilities/getURL'

const PRIVATE_PATHS = [
  '/admin',
  '/admin/',
  '/api/',
  '/next/',
  '/payload/',
  '/payload',
  '/cart',
  '/checkout',
  '/login',
  '/logout',
  '/create-account',
  '/forgot-password',
  '/account',
  '/orders',
  '/wishlist',
  '/compare',
]

type RobotsRule = {
  userAgent: string
  allow?: string[]
  disallow: string[]
  comment?: string
}

function formatRule(rule: RobotsRule): string {
  const lines: string[] = []

  if (rule.comment) {
    lines.push(rule.comment)
  }

  lines.push(`User-agent: ${rule.userAgent}`)

  if (rule.allow?.length) {
    for (const path of rule.allow) {
      lines.push(`Allow: ${path}`)
    }
  }

  for (const path of rule.disallow) {
    lines.push(`Disallow: ${path}`)
  }

  return lines.join('\n')
}

/** Plain-text robots.txt body for `/robots.txt`. */
export function buildRobotsTxt(): string {
  const base = getServerSideURL()
  const disallowWithoutApi = PRIVATE_PATHS.filter((p) => p !== '/api/')

  const aiBotAllow = ['/llms.txt', '/llms-full.txt', '/api/ai', '/api/feeds/google-merchant']

  const rules: RobotsRule[] = [
    // === Private paths (Disallow for all) ===
    {
      userAgent: '*',
      // Longer Allow paths win over the /api/ Disallow, so crawlers without a
      // dedicated group below can still fetch product images and AI guidance.
      allow: ['/api/media/file/', '/llms.txt', '/llms-full.txt'],
      disallow: PRIVATE_PATHS,
      comment: '# === Private paths (Disallow for all) ===',
    },

    // === Major search engines ===
    {
      userAgent: 'Googlebot',
      allow: aiBotAllow,
      disallow: disallowWithoutApi,
      comment: '# === Major search engines ===',
    },
    { userAgent: 'Bingbot', allow: aiBotAllow, disallow: disallowWithoutApi },
    { userAgent: 'DuckDuckBot', allow: aiBotAllow, disallow: disallowWithoutApi },
    { userAgent: 'Applebot', allow: aiBotAllow, disallow: disallowWithoutApi },

    // === AI / answer engines (allowed to index llms.txt, /api/ai/*, product/category pages) ===
    {
      userAgent: 'GPTBot',
      allow: aiBotAllow,
      disallow: disallowWithoutApi,
      comment:
        '# === AI / answer engines (allowed to index llms.txt, /api/ai/*, product/category pages) ===',
    },
    { userAgent: 'Google-Extended', allow: aiBotAllow, disallow: disallowWithoutApi },
    { userAgent: 'anthropic-ai', allow: aiBotAllow, disallow: disallowWithoutApi },
    { userAgent: 'ClaudeBot', allow: aiBotAllow, disallow: disallowWithoutApi },
    { userAgent: 'Claude-Web', allow: aiBotAllow, disallow: disallowWithoutApi },
    { userAgent: 'PerplexityBot', allow: aiBotAllow, disallow: disallowWithoutApi },
    { userAgent: 'CCBot', allow: aiBotAllow, disallow: disallowWithoutApi },
    { userAgent: 'OAI-SearchBot', allow: aiBotAllow, disallow: disallowWithoutApi },
    { userAgent: 'Applebot-Extended', allow: aiBotAllow, disallow: disallowWithoutApi },
    { userAgent: 'Amazonbot', allow: aiBotAllow, disallow: disallowWithoutApi },
  ]

  // The index at /sitemap.xml plus each segment directly, so crawlers that
  // skip index files still discover every sitemap.
  const sitemapLines = [
    `Sitemap: ${base}/sitemap.xml`,
    ...SITEMAP_SEGMENT_IDS.map((id) => `Sitemap: ${base}/sitemap/${id}.xml`),
  ].join('\n')

  return [...rules.map(formatRule), '', `Host: ${base}`, sitemapLines].join('\n\n') + '\n'
}
