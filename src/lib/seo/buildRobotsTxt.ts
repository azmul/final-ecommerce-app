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
}

function formatRule(rule: RobotsRule): string {
  const lines = [`User-agent: ${rule.userAgent}`]

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
    { userAgent: '*', disallow: PRIVATE_PATHS },
    { userAgent: 'GPTBot', allow: aiBotAllow, disallow: disallowWithoutApi },
    { userAgent: 'Google-Extended', allow: aiBotAllow, disallow: disallowWithoutApi },
    { userAgent: 'anthropic-ai', allow: aiBotAllow, disallow: disallowWithoutApi },
    { userAgent: 'PerplexityBot', allow: aiBotAllow, disallow: disallowWithoutApi },
  ]

  return [
    ...rules.map(formatRule),
    '',
    `Host: ${base}`,
    `Sitemap: ${base}/sitemap.xml`,
  ].join('\n\n') + '\n'
}
