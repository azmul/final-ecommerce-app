import type { Config, Plugin } from 'payload'

import { ReturnRequests } from '@/collections/ReturnRequests'

const PRODUCTS_SLUG = 'products'
const RETURN_SLUG = 'return-requests'

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

export function appendReturnRequestsAfterProductsPlugin(): Plugin {
  return (incomingConfig: Config): Config => {
    const existing = [...(incomingConfig.collections ?? [])]
    const withoutReturn = existing.filter((c) => getCollectionSlug(c) !== RETURN_SLUG)
    const productsIndex = withoutReturn.findIndex((c) => getCollectionSlug(c) === PRODUCTS_SLUG)
    const insertAt = productsIndex === -1 ? withoutReturn.length : productsIndex + 1
    const collections = [
      ...withoutReturn.slice(0, insertAt),
      ReturnRequests,
      ...withoutReturn.slice(insertAt),
    ]

    return {
      ...incomingConfig,
      collections,
    }
  }
}
