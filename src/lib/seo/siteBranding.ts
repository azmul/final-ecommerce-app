import type { Metadata } from 'next'

import { PWA_ICON_PATHS } from '@/lib/pwa/config'
import { getSiteSeoConfig } from '@/lib/seo/siteConfig'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { toAbsoluteUrl } from '@/utilities/getURL'
import { resolveMediaUrl } from '@/utilities/resolveMediaUrl'

export type SiteBranding = {
  fromCms: boolean
  logoHeight?: number | null
  logoMimeType: string | null
  logoUrl: string
  logoWidth?: number | null
}

export async function getSiteBranding(): Promise<SiteBranding> {
  const site = getSiteSeoConfig()
  const settings = await getCachedGlobal('settings', 1)()
  const media = settings.logo
  const path = resolveMediaUrl(media)

  if (path) {
    const logoUrl = toAbsoluteUrl(path) ?? site.logoUrl
    const logoMedia = typeof media === 'object' ? media : null

    return {
      fromCms: true,
      logoHeight: logoMedia?.height ?? null,
      logoMimeType: logoMedia?.mimeType ?? null,
      logoUrl,
      logoWidth: logoMedia?.width ?? null,
    }
  }

  return {
    fromCms: false,
    logoMimeType: null,
    logoUrl: site.logoUrl,
  }
}

export async function getSiteSeoConfigAsync() {
  const site = getSiteSeoConfig()
  const branding = await getSiteBranding()
  return { ...site, logoUrl: branding.logoUrl }
}

function brandingIconType(branding: SiteBranding): string {
  if (branding.logoMimeType) return branding.logoMimeType
  if (branding.logoUrl.endsWith('.svg')) return 'image/svg+xml'
  return 'image/png'
}

function brandingIconSizes(branding: SiteBranding): string {
  if (branding.logoWidth && branding.logoHeight) {
    return `${branding.logoWidth}x${branding.logoHeight}`
  }
  if (branding.logoUrl.endsWith('.svg')) return 'any'
  return '512x512'
}

export function buildSiteMetadataIcons(branding: SiteBranding): Metadata['icons'] {
  if (!branding.fromCms) {
    return {
      apple: [{ url: PWA_ICON_PATHS.apple, sizes: '180x180', type: 'image/png' }],
      icon: [
        { url: PWA_ICON_PATHS.faviconSvg, type: 'image/svg+xml' },
        { url: PWA_ICON_PATHS.any192, sizes: '192x192', type: 'image/png' },
      ],
    }
  }

  const type = brandingIconType(branding)
  const sizes = brandingIconSizes(branding)

  return {
    apple: [{ url: branding.logoUrl, sizes: '180x180', type }],
    icon: [{ url: branding.logoUrl, sizes, type }],
  }
}

export function brandingManifestIconSizes(branding: SiteBranding): string {
  return brandingIconSizes(branding)
}

export function brandingManifestIconType(branding: SiteBranding): string {
  return brandingIconType(branding)
}
