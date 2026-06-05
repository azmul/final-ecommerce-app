import type { Config, Plugin } from 'payload'
import { Subscriptions } from '@/collections/Subscriptions'

const PRODUCTS_SLUG = 'products'

function getCollectionSlug(candidate: unknown): string | undefined {
  if (candidate && typeof candidate === 'object' && 'slug' in candidate) {
    const slug = (candidate as { slug: unknown }).slug
    if (typeof slug === 'string') return slug
  }
  return undefined
}

export function appendSubscriptionsAfterProductsPlugin(): Plugin {
  return (incomingConfig: Config): Config => {
    const existing = [...(incomingConfig.collections ?? [])]
    const without = existing.filter((c) => getCollectionSlug(c) !== 'subscriptions')
    const productsIndex = without.findIndex((c) => getCollectionSlug(c) === PRODUCTS_SLUG)
    const insertAt = productsIndex === -1 ? without.length : productsIndex + 1
    return {
      ...incomingConfig,
      collections: [...without.slice(0, insertAt), Subscriptions, ...without.slice(insertAt)],
    }
  }
}
