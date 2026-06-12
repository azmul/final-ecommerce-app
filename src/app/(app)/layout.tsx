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
import { GeistMono } from 'geist/font/mono'
import { AnalyticsScripts } from '@/components/analytics/AnalyticsScripts'
import { DeferredStorefrontWidgets } from '@/components/DeferredStorefrontWidgets'
import React from 'react'
import './globals.css'

import { JsonLd } from '@/lib/seo/JsonLd'
import {
  buildOrganizationJsonLd,
  buildWebSiteJsonLd,
} from '@/lib/seo/buildOrganizationJsonLd'
import { PWA_ICON_PATHS, PWA_THEME_COLOR } from '@/lib/pwa/config'
import { getSiteSeoConfig } from '@/lib/seo/siteConfig'

const site = getSiteSeoConfig()
const siteName = site.name
const siteDescription = site.description

export const viewport: Viewport = {
  colorScheme: 'light',
  initialScale: 1,
  themeColor: PWA_THEME_COLOR,
  width: 'device-width',
}

export const metadata: Metadata = {
  applicationName: siteName,
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: siteName,
  },
  icons: {
    apple: [{ url: PWA_ICON_PATHS.apple, sizes: '180x180', type: 'image/png' }],
    icon: [
      { url: PWA_ICON_PATHS.faviconSvg, type: 'image/svg+xml' },
      { url: PWA_ICON_PATHS.any192, sizes: '192x192', type: 'image/png' },
    ],
  },
  manifest: '/manifest.webmanifest',
  description: siteDescription,
  metadataBase: new URL(getServerSideURL()),
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
}

export default async function RootLayout({ children }: { children: ReactNode }) {
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
        <link href={PWA_ICON_PATHS.faviconSvg} rel="icon" type="image/svg+xml" />
        <link href={PWA_ICON_PATHS.apple} rel="apple-touch-icon" sizes="180x180" />
        <meta content="yes" name="mobile-web-app-capable" />
      </head>
      <body suppressHydrationWarning>
        <JsonLd data={[buildOrganizationJsonLd(site), buildWebSiteJsonLd(site)]} />
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
        </Providers>
      </body>
    </html>
  )
}
