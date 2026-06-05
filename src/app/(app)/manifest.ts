import type { MetadataRoute } from 'next'

import { getSiteSeoConfig } from '@/lib/seo/siteConfig'

export default function manifest(): MetadataRoute.Manifest {
  const site = getSiteSeoConfig()

  return {
    background_color: '#fafafa',
    description: site.description,
    display: 'standalone',
    icons: [
      {
        purpose: 'any',
        sizes: 'any',
        src: '/favicon.svg',
        type: 'image/svg+xml',
      },
      {
        purpose: 'maskable',
        sizes: 'any',
        src: '/favicon.svg',
        type: 'image/svg+xml',
      },
    ],
    name: site.name,
    orientation: 'portrait-primary',
    short_name: site.name,
    start_url: '/',
    theme_color: '#fafafa',
  }
}
