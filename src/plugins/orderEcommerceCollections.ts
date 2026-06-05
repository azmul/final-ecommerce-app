import type { CollectionConfig, Config, Plugin } from 'payload'

const ECOMMERCE_GROUP = 'Ecommerce'

/** Desired Ecommerce admin sidebar order (first match wins; unlisted collections keep relative order after these). */
const ECOMMERCE_NAV_ORDER = [
  'products',
  'orders',
  'shipments',
  'carts',
  'transactions',
] as const

function getAdminGroup(collection: CollectionConfig): string | undefined {
  const g = collection.admin?.group
  return typeof g === 'string' ? g : undefined
}

function getCollectionSlug(collection: CollectionConfig): string | undefined {
  return typeof collection.slug === 'string' ? collection.slug : undefined
}

/**
 * Payload orders admin sidebar items by collection registration order within a group.
 * Pins Products, Orders, Shipments, Carts, and Transactions to the top of Ecommerce.
 */
export function orderEcommerceCollectionsPlugin(): Plugin {
  return (incomingConfig: Config): Config => {
    const existing = [...(incomingConfig.collections ?? [])]
    const firstEcommerceIndex = existing.findIndex((c) => getAdminGroup(c) === ECOMMERCE_GROUP)

    if (firstEcommerceIndex === -1) {
      return incomingConfig
    }

    const nonEcommerce = existing.filter((c) => getAdminGroup(c) !== ECOMMERCE_GROUP)
    const ecommerce = existing.filter((c) => getAdminGroup(c) === ECOMMERCE_GROUP)

    const pinned = ECOMMERCE_NAV_ORDER.flatMap((slug) =>
      ecommerce.filter((c) => getCollectionSlug(c) === slug),
    )
    const pinnedSlugs = new Set<string>(ECOMMERCE_NAV_ORDER)
    const rest = ecommerce.filter((c) => {
      const slug = getCollectionSlug(c)
      return slug === undefined || !pinnedSlugs.has(slug)
    })

    const orderedEcommerce = [...pinned, ...rest]

    let insertAt = 0
    for (let i = 0; i < firstEcommerceIndex; i++) {
      if (getAdminGroup(existing[i]) !== ECOMMERCE_GROUP) {
        insertAt++
      }
    }

    const collections = [
      ...nonEcommerce.slice(0, insertAt),
      ...orderedEcommerce,
      ...nonEcommerce.slice(insertAt),
    ]

    return {
      ...incomingConfig,
      collections,
    }
  }
}
