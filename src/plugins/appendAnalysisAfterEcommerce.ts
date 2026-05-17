import type { CollectionConfig, Config, Plugin } from 'payload'

import { SalesAnalytics } from '@/collections/SalesAnalytics'

const ECOMMERCE_GROUP = 'Ecommerce'

function getAdminGroup(collection: CollectionConfig): string | undefined {
  const g = collection.admin?.group
  return typeof g === 'string' ? g : undefined
}

/**
 * Registers the sales dashboard under the Analysis nav group, placed after Ecommerce
 * collections (same pattern as notifications after ecommerce).
 */
export function appendAnalysisAfterEcommercePlugin(): Plugin {
  return (incomingConfig: Config): Config => {
    const existing = [...(incomingConfig.collections ?? [])]
    const withoutAnalysis = existing.filter((c) => c.slug !== SalesAnalytics.slug)

    let lastEcommerceIndex = -1
    withoutAnalysis.forEach((c, i) => {
      if (getAdminGroup(c) === ECOMMERCE_GROUP) {
        lastEcommerceIndex = i
      }
    })

    const insertAt =
      lastEcommerceIndex === -1 ? withoutAnalysis.length : lastEcommerceIndex + 1

    const collections = [
      ...withoutAnalysis.slice(0, insertAt),
      SalesAnalytics,
      ...withoutAnalysis.slice(insertAt),
    ]

    return {
      ...incomingConfig,
      collections,
    }
  }
}
