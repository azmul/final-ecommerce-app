import type { MetadataRoute } from 'next'

import { fetchSitemapSegment, SITEMAP_SEGMENT_IDS, type SitemapSegmentId } from '@/lib/seo/sitemapData'

export async function generateSitemaps() {
  return SITEMAP_SEGMENT_IDS.map((id) => ({ id }))
}

export default async function sitemap(props: {
  id: Promise<SitemapSegmentId>
}): Promise<MetadataRoute.Sitemap> {
  const id = await props.id
  return fetchSitemapSegment(id)
}
