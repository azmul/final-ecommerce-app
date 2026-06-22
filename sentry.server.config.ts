// This file configures Sentry for the Node.js (server) runtime.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'

const dsn = process.env.SENTRY_DSN || ''

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    // Capture 100% of errors on the server — they indicate real issues.
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    // Attach request details to error events.
    sendDefaultPii: false,
  })
}
