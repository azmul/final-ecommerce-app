import { SITEMAP_SEGMENT_IDS } from '@/lib/seo/sitemapData'
import { getServerSideURL } from '@/utilities/getURL'

export const revalidate = 3600

/**
 * Sitemap index. Served at both /sitemap-index.xml and /sitemap.xml (via a
 * beforeFiles rewrite in next.config.ts — Next's metadata router reserves
 * /sitemap.xml but only serves the generateSitemaps() segments at
 * /sitemap/[id].xml, leaving the bare path a 404).
 */
export async function GET(): Promise<Response> {
  const base = getServerSideURL()
  const lastmod = new Date().toISOString()

  const entries = SITEMAP_SEGMENT_IDS.map(
    (id) => `  <sitemap>\n    <loc>${base}/sitemap/${id}.xml</loc>\n    <lastmod>${lastmod}</lastmod>\n  </sitemap>`,
  ).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</sitemapindex>\n`

  return new Response(xml, {
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
      'Content-Type': 'application/xml; charset=utf-8',
    },
  })
}
