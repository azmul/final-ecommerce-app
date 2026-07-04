import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'

import { AdminBar } from '@/components/AdminBar'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { PublicFullPageNavigation } from '@/components/PublicFullPageNavigation'
import { SkipToContent } from '@/components/SkipToContent'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { Providers } from '@/providers'
import { InitTheme } from '@/providers/Theme/InitTheme'
import { getServerSideURL } from '@/utilities/getURL'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { GeistSans } from 'geist/font/sans'
import localFont from 'next/font/local'

// GeistMono is a UI accent font (labels, badges) — loading it without preload
// keeps ~73 KB off the critical path that gates mobile LCP. `geist/font/mono`
// hardcodes preload, so load the same variable file via next/font/local.
const GeistMono = localFont({
  display: 'swap',
  preload: false,
  src: '../../../node_modules/geist/dist/fonts/geist-mono/GeistMono-Variable.woff2',
  variable: '--font-geist-mono',
})
import { AnalyticsScripts } from '@/components/analytics/AnalyticsScripts'
import { DeferredStorefrontWidgets } from '@/components/DeferredStorefrontWidgets'
import { CookieConsentBanner } from '@/components/privacy/CookieConsentBanner'
import React from 'react'
import './globals.css'

import { JsonLd } from '@/lib/seo/JsonLd'
import {
  buildOrganizationJsonLd,
  buildWebSiteJsonLd,
} from '@/lib/seo/buildOrganizationJsonLd'
import { PWA_ICON_PATHS, PWA_THEME_COLOR } from '@/lib/pwa/config'
import {
  brandingManifestIconType,
  buildSiteMetadataIcons,
  getSiteBranding,
  getSiteSeoConfigAsync,
} from '@/lib/seo/siteBranding'
import { getSiteSeoConfig } from '@/lib/seo/siteConfig'

const site = getSiteSeoConfig()
const siteName = site.name
const siteDescription = site.description

const googleVerification = process.env.GOOGLE_SITE_VERIFICATION?.trim()
const bingVerification = process.env.BING_SITE_VERIFICATION?.trim()

export const viewport: Viewport = {
  colorScheme: 'light',
  initialScale: 1,
  themeColor: PWA_THEME_COLOR,
  width: 'device-width',
}

export async function generateMetadata(): Promise<Metadata> {
  const branding = await getSiteBranding()
  const siteUrl = getServerSideURL()

  return {
    applicationName: siteName,
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: siteName,
    },
    alternates: {
      canonical: siteUrl,
      languages: {
        'en-BD': siteUrl,
        'x-default': siteUrl,
      },
    },
    icons: buildSiteMetadataIcons(branding),
    manifest: '/manifest.webmanifest',
    description: siteDescription,
    metadataBase: new URL(siteUrl),
    openGraph: mergeOpenGraph({ title: siteName }),
    referrer: 'strict-origin-when-cross-origin',
    robots: { follow: true, googleBot: { follow: true, index: true }, index: true },
    title: {
      default: siteName,
      template: `%s · ${siteName}`,
    },
    twitter: {
      card: 'summary_large_image',
      description: siteDescription,
      title: siteName,
    },
    ...(googleVerification || bingVerification ?
      {
        verification: {
          ...(googleVerification ? { google: googleVerification } : {}),
          ...(bingVerification ? { other: { 'msvalidate.01': bingVerification } } : {}),
        },
      }
    : {}),
  }
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const siteWithLogo = await getSiteSeoConfigAsync()
  const branding = await getSiteBranding()
  const faviconType = branding.fromCms ? brandingManifestIconType(branding) : 'image/svg+xml'

  return (
    <html
      className={[GeistSans.variable, GeistMono.variable].filter(Boolean).join(' ')}
      data-theme="light"
      lang="en"
      suppressHydrationWarning
    >
      <head>
        <InitTheme />
        <AnalyticsScripts />
        {branding.fromCms ?
          <>
            <link href={branding.logoUrl} rel="icon" type={faviconType} />
            <link href={branding.logoUrl} rel="apple-touch-icon" />
          </>
        : <>
            <link href={PWA_ICON_PATHS.faviconSvg} rel="icon" type="image/svg+xml" />
            <link href={PWA_ICON_PATHS.apple} rel="apple-touch-icon" sizes="180x180" />
          </>
        }
        <meta content="yes" name="mobile-web-app-capable" />
      </head>
      <body suppressHydrationWarning>
        <JsonLd
          data={[buildOrganizationJsonLd(siteWithLogo), buildWebSiteJsonLd(siteWithLogo)]}
        />
        <Providers>
          <SkipToContent />
          <AdminBar />
          <LivePreviewListener />
          <PublicFullPageNavigation />

          <DeferredStorefrontWidgets />

          <Header />
          <main id="main-content" tabIndex={-1}>
            {children}
          </main>
          <Footer />
          <CookieConsentBanner />
        </Providers>
      </body>
    </html>
  )
}
