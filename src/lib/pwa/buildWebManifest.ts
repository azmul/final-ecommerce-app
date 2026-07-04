import type { MetadataRoute } from 'next'

import { PWA_BACKGROUND_COLOR, PWA_ICON_PATHS, PWA_THEME_COLOR } from '@/lib/pwa/config'
import {
  brandingManifestIconSizes,
  brandingManifestIconType,
  getSiteBranding,
  getSiteSeoConfigAsync,
} from '@/lib/seo/siteBranding'

/** Shared PWA manifest payload for route handler and metadata. */
export async function buildWebManifest(): Promise<MetadataRoute.Manifest> {
  const site = await getSiteSeoConfigAsync()
  const branding = await getSiteBranding()
  const shortcutIconSrc = branding.fromCms ? branding.logoUrl : PWA_ICON_PATHS.any192
  const shortcutIconType = branding.fromCms ? brandingManifestIconType(branding) : 'image/png'
  const shortcutIconSizes =
    branding.fromCms ? brandingManifestIconSizes(branding) : '192x192'

  // Installability requires 192px + 512px PNGs and a maskable icon. Always
  // ship the static set; a CMS logo is additive, never a replacement.
  const icons: MetadataRoute.Manifest['icons'] = [
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
    ...(branding.fromCms ?
      [
        {
          purpose: 'any' as const,
          sizes: brandingManifestIconSizes(branding),
          src: branding.logoUrl,
          type: brandingManifestIconType(branding),
        },
      ]
    : []),
  ]

  return {
    background_color: PWA_BACKGROUND_COLOR,
    categories: ['shopping', 'lifestyle'],
    description: site.description,
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui', 'browser'],
    icons,
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
        icons: [{ src: shortcutIconSrc, sizes: shortcutIconSizes, type: shortcutIconType }],
      },
      {
        name: 'Cart',
        short_name: 'Cart',
        url: '/cart',
        icons: [{ src: shortcutIconSrc, sizes: shortcutIconSizes, type: shortcutIconType }],
      },
      {
        name: 'Account',
        short_name: 'Account',
        url: '/account',
        icons: [{ src: shortcutIconSrc, sizes: shortcutIconSizes, type: shortcutIconType }],
      },
    ],
    start_url: '/',
    theme_color: PWA_THEME_COLOR,
  }
}
