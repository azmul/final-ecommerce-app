import type { Config, Plugin } from 'payload'

import { ProductReviews } from '@/collections/ProductReviews'

/** Default ecommerce products collection slug (`createProductsCollection` in plugin-ecommerce). */
const PRODUCTS_SLUG = 'products'

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
 * Registers Product Reviews immediately after Products in the sidebar. Payload sorts admin nav by
 * collection registration order within `admin.group`, and the ecommerce plugin appends Products
 * later than bootstrap collections — so registering reviews here avoids it floating above Products.
 */
export function appendProductReviewsAfterProductsPlugin(): Plugin {
  return (incomingConfig: Config): Config => {
    const existing = [...(incomingConfig.collections ?? [])]
    const slug = ProductReviews.slug
    const withoutReview = existing.filter((c) => getCollectionSlug(c) !== slug)
    const productsIndex = withoutReview.findIndex((c) => getCollectionSlug(c) === PRODUCTS_SLUG)
    const insertAt = productsIndex === -1 ? withoutReview.length : productsIndex + 1
    const collections = [...withoutReview.slice(0, insertAt), ProductReviews, ...withoutReview.slice(insertAt)]

    return {
      ...incomingConfig,
      collections,
    }
  }
}
