import type { Metadata } from 'next'

/** Metadata for transactional / account pages that should not be indexed. */
export function noindexMetadata(overrides: Metadata = {}): Metadata {
  return {
    ...overrides,
    robots: {
      follow: false,
      googleBot: {
        follow: false,
        index: false,
        noimageindex: true,
      },
      index: false,
      nocache: true,
    },
  }
}
