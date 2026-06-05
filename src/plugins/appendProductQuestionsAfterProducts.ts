import type { Config, Plugin } from 'payload'

import { ProductQuestions } from '@/collections/ProductQuestions'

const PRODUCTS_SLUG = 'products'
const SLUG = 'product-questions'

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

export function appendProductQuestionsAfterProductsPlugin(): Plugin {
  return (incomingConfig: Config): Config => {
    const existing = [...(incomingConfig.collections ?? [])]
    const without = existing.filter((c) => getCollectionSlug(c) !== SLUG)
    const productsIndex = without.findIndex((c) => getCollectionSlug(c) === PRODUCTS_SLUG)
    const insertAt = productsIndex === -1 ? without.length : productsIndex + 1

    return {
      ...incomingConfig,
      collections: [
        ...without.slice(0, insertAt),
        ProductQuestions,
        ...without.slice(insertAt),
      ],
    }
  }
}
