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
import dynamic from 'next/dynamic'
import { AnalyticsScripts } from '@/components/analytics/AnalyticsScripts'
import React from 'react'
import './globals.css'

import { JsonLd } from '@/lib/seo/JsonLd'
import {
  buildOrganizationJsonLd,
  buildWebSiteJsonLd,
} from '@/lib/seo/buildOrganizationJsonLd'
import { getSiteSeoConfig } from '@/lib/seo/siteConfig'

const site = getSiteSeoConfig()
const siteName = site.name
const siteDescription = site.description

export const viewport: Viewport = {
  colorScheme: 'light',
  initialScale: 1,
  themeColor: '#fafafa',
  width: 'device-width',
}

export const metadata: Metadata = {
  applicationName: siteName,
  appleWebApp: { capable: true, title: siteName },
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

const CartModal = dynamic(() =>
  import('@/components/Cart/CartModal').then((mod) => ({ default: mod.CartModal })),
)

const FloatingCartBubble = dynamic(() =>
  import('@/components/Cart/FloatingCartBubble').then((mod) => ({
    default: mod.FloatingCartBubble,
  })),
)

const CompareFloatingBar = dynamic(() =>
  import('@/components/compare/CompareFloatingBar').then((mod) => ({
    default: mod.CompareFloatingBar,
  })),
)

const ChatWidget = dynamic(() =>
  import('@/components/chat').then((mod) => ({ default: mod.ChatWidget })),
)

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
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
      </head>
      <body suppressHydrationWarning>
        <JsonLd data={[buildOrganizationJsonLd(site), buildWebSiteJsonLd(site)]} />
        <Providers>
          <AdminBar />
          <LivePreviewListener />
          <PublicFullPageNavigation />

          <CartModal />
          <FloatingCartBubble />
          <CompareFloatingBar />
          <ChatWidget />

          <SkipToContent />
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
