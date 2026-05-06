import type { Config, Plugin } from 'payload'

import { Shipments } from '@/collections/Shipment'

const TRANSACTIONS_SLUG = 'transactions'
const SHIPMENTS_SLUG = 'shipments'

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
 * Payload orders admin nav by collection registration order within the same group.
 * The ecommerce plugin registers `transactions` after `payload.config.ts` collections,
 * so we move Shipments to immediately after Transactions to match desired menu order.
 */
export function appendShipmentsAfterTransactionsPlugin(): Plugin {
  return (incomingConfig: Config): Config => {
    const existing = [...(incomingConfig.collections ?? [])]

    const withoutShipments = existing.filter((c) => getCollectionSlug(c) !== SHIPMENTS_SLUG)
    const transactionsIndex = withoutShipments.findIndex(
      (c) => getCollectionSlug(c) === TRANSACTIONS_SLUG,
    )
    const insertAt = transactionsIndex === -1 ? withoutShipments.length : transactionsIndex + 1

    const collections = [
      ...withoutShipments.slice(0, insertAt),
      Shipments,
      ...withoutShipments.slice(insertAt),
    ]

    return {
      ...incomingConfig,
      collections,
    }
  }
}

