import type { Config, Plugin } from 'payload'

import { QuoteRequests } from '@/collections/QuoteRequests'

const PRODUCTS_SLUG = 'products'
const QUOTE_SLUG = 'quote-requests'

function getCollectionSlug(candidate: unknown): string | undefined {
  if (
    candidate &&
    typeof candidate === 'object' &&
    'slug' in candidate &&
    typeof (candidate as { slug: unknown }).slug === 'string'
  ) {
    return (candidate as { slug: string }).slug
  }
  return undefined
}

export function appendQuoteRequestsAfterProductsPlugin(): Plugin {
  return (incomingConfig: Config): Config => {
    const existing = [...(incomingConfig.collections ?? [])]
    const withoutQuote = existing.filter((c) => getCollectionSlug(c) !== QUOTE_SLUG)
    const productsIndex = withoutQuote.findIndex((c) => getCollectionSlug(c) === PRODUCTS_SLUG)
    const insertAt = productsIndex === -1 ? withoutQuote.length : productsIndex + 1
    const collections = [
      ...withoutQuote.slice(0, insertAt),
      QuoteRequests,
      ...withoutQuote.slice(insertAt),
    ]

    return {
      ...incomingConfig,
      collections,
    }
  }
}
