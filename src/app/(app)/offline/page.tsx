import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

export const metadata: Metadata = {
  description: 'You appear to be offline. Reconnect to keep shopping.',
  robots: {
    follow: false,
    index: false,
  },
  title: 'Offline',
}

/**
 * Navigation fallback served by the service worker when the network is
 * unavailable and the requested page is not cached. Precached in sw.js —
 * keep this page dependency-light so it renders from cache alone.
 */
export default function OfflinePage() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-lg flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <span aria-hidden className="text-5xl">📡</span>
      <h1 className="text-2xl font-bold tracking-tight">You&apos;re offline</h1>
      <p className="text-sm text-muted-foreground">
        This page isn&apos;t available without a connection. Items already in your cart are saved
        and will sync once you&apos;re back online.
      </p>
      <Link
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        href="/"
      >
        Try the home page
      </Link>
    </div>
  )
}
