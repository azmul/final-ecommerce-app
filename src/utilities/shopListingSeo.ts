import type { Metadata } from 'next'

import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { getServerSideURL } from '@/utilities/getURL'

/**
 * Canonical listing URLs ignore query params (search, sort, subcategory filters).
 * Non-clean URLs get noindex,follow to reduce duplicate URLs in the index.
 */
export function shopListingMetadata(input: {
  title: string
  description: string
  canonicalPath: string
  hasFilteredQuery: boolean
}): Metadata {
  const base = getServerSideURL()
  const canonicalUrl = `${base}${input.canonicalPath}`

  return {
    alternates: { canonical: canonicalUrl },
    description: input.description,
    other: {
      'ai-summary': input.description,
    },
    openGraph: mergeOpenGraph({
      description: input.description,
      title: input.title,
      url: canonicalUrl,
    }),
    robots:
      input.hasFilteredQuery ?
        {
          follow: true,
          googleBot: { follow: true, index: false },
          index: false,
        }
      : undefined,
    title: input.title,
    twitter: {
      card: 'summary_large_image',
      description: input.description,
      title: input.title,
    },
  }
}
