// This file configures Sentry for the browser (client) runtime.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN || ''

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENV || process.env.NODE_ENV || 'development',
    // Don't capture IPs / request data by default (privacy).
    sendDefaultPii: false,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    ignoreErrors: [
      'ResizeObserver loop completed with undelivered notifications',
      'Network request failed',
      'Failed to fetch',
    ],
  })
}
