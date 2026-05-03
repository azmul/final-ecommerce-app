import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'

import { AdminBar } from '@/components/AdminBar'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { Providers } from '@/providers'
import { InitTheme } from '@/providers/Theme/InitTheme'
import { getServerSideURL } from '@/utilities/getURL'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import dynamic from 'next/dynamic'
import { OrganizationJsonLd } from 'next-seo'
import React from 'react'
import './globals.css'

const siteName = process.env.SITE_NAME || process.env.COMPANY_NAME || 'Store'
const siteDescription =
  'Shop quality products with a fast, accessible checkout experience.'

export const viewport: Viewport = {
  colorScheme: 'dark light',
  initialScale: 1,
  themeColor: [
    { color: '#fafafa', media: '(prefers-color-scheme: light)' },
    { color: '#252525', media: '(prefers-color-scheme: dark)' },
  ],
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

export default async function RootLayout({ children }: { children: ReactNode }) {
  const siteUrl = getServerSideURL()
  return (
    <html
      className={[GeistSans.variable, GeistMono.variable].filter(Boolean).join(' ')}
      lang="en"
      suppressHydrationWarning
    >
      <head>
        <InitTheme />
        <link href="/favicon.ico" rel="icon" sizes="32x32" />
        <link href="/favicon.svg" rel="icon" type="image/svg+xml" />
      </head>
      <body>
        <Providers>
          <OrganizationJsonLd
            type="OnlineStore"
            name={siteName}
            url={siteUrl}
            description={siteDescription}
            logo={`${siteUrl}/favicon.svg`}
          />
          <AdminBar />
          <LivePreviewListener />

          <CartModal />
          <FloatingCartBubble />

          <Header />
          <main>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
