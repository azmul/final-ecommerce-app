import type { Config, Plugin } from 'payload'

import { PromoCodes } from '@/collections/PromoCodes'

const PRODUCTS_SLUG = 'products'
const PROMO_SLUG = 'promo-codes'

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

/**
 * Keeps Promo Codes directly under Products in the Ecommerce admin group. Payload orders nav by
 * collection registration order within the same group.
 */
export function appendPromoCodesAfterProductsPlugin(): Plugin {
  return (incomingConfig: Config): Config => {
    const existing = [...(incomingConfig.collections ?? [])]
    const withoutPromo = existing.filter((c) => getCollectionSlug(c) !== PROMO_SLUG)
    const productsIndex = withoutPromo.findIndex((c) => getCollectionSlug(c) === PRODUCTS_SLUG)
    const insertAt = productsIndex === -1 ? withoutPromo.length : productsIndex + 1
    const collections = [...withoutPromo.slice(0, insertAt), PromoCodes, ...withoutPromo.slice(insertAt)]

    return {
      ...incomingConfig,
      collections,
    }
  }
}
