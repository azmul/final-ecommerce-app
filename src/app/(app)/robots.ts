/* eslint-disable no-restricted-exports */
import type { MetadataRoute } from 'next'

import { getServerSideURL } from '@/utilities/getURL'

export default function robots(): MetadataRoute.Robots {
  const base = getServerSideURL()

  return {
    host: base,
    rules: [
      {
        allow: '/',
        disallow: ['/admin', '/admin/', '/api/', '/next/', '/payload/', '/payload'],
        userAgent: '*',
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
