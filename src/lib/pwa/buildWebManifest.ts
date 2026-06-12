import type { MetadataRoute } from 'next'

import { PWA_BACKGROUND_COLOR, PWA_ICON_PATHS, PWA_THEME_COLOR } from '@/lib/pwa/config'
import { getSiteSeoConfig } from '@/lib/seo/siteConfig'

/** Shared PWA manifest payload for route handler and metadata. */
export function buildWebManifest(): MetadataRoute.Manifest {
  const site = getSiteSeoConfig()

  return {
    background_color: PWA_BACKGROUND_COLOR,
    categories: ['shopping', 'lifestyle'],
    description: site.description,
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui', 'browser'],
    icons: [
      {
        purpose: 'any',
        sizes: '192x192',
        src: PWA_ICON_PATHS.any192,
        type: 'image/png',
      },
      {
        purpose: 'any',
        sizes: '512x512',
        src: PWA_ICON_PATHS.any512,
        type: 'image/png',
      },
      {
        purpose: 'maskable',
        sizes: '512x512',
        src: PWA_ICON_PATHS.maskable512,
        type: 'image/png',
      },
      {
        purpose: 'any',
        sizes: 'any',
        src: PWA_ICON_PATHS.faviconSvg,
        type: 'image/svg+xml',
      },
    ],
    id: '/',
    lang: site.locale.split('-')[0] || 'en',
    name: site.name,
    orientation: 'portrait-primary',
    scope: '/',
    short_name: site.name.length > 12 ? site.name.slice(0, 12).trim() : site.name,
    shortcuts: [
      {
        name: 'Shop',
        short_name: 'Shop',
        url: '/shop',
        icons: [{ src: PWA_ICON_PATHS.any192, sizes: '192x192', type: 'image/png' }],
      },
      {
        name: 'Cart',
        short_name: 'Cart',
        url: '/cart',
        icons: [{ src: PWA_ICON_PATHS.any192, sizes: '192x192', type: 'image/png' }],
      },
      {
        name: 'Account',
        short_name: 'Account',
        url: '/account',
        icons: [{ src: PWA_ICON_PATHS.any192, sizes: '192x192', type: 'image/png' }],
      },
    ],
    start_url: '/',
    theme_color: PWA_THEME_COLOR,
  }
}
