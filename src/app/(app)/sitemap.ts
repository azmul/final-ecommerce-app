import type { MetadataRoute } from 'next'

import { fetchFullSitemap } from '@/lib/seo/sitemapData'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return fetchFullSitemap()
}
