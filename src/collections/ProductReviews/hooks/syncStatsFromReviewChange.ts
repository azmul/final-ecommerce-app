import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import { syncReviewStatsForProduct } from '@/collections/ProductReviews/syncReviewStatsForProduct'

function resolveProductId(product: unknown): number | string | undefined {
  if (product === null || product === undefined) return undefined
  if (typeof product === 'object' && 'id' in product && product.id !== undefined && product.id !== null) {
    return product.id as number | string
  }

  return product as number | string
}

export const syncStatsAfterReviewChange: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
}) => {
  if (!req.payload) return doc

  const nextId = resolveProductId((doc as { product?: unknown })?.product)
  const prevId = resolveProductId((previousDoc as { product?: unknown })?.product)

  if (prevId !== undefined && prevId !== nextId && previousDoc?.id !== undefined) {
    await syncReviewStatsForProduct(req.payload, req, prevId)
  }

  if (nextId !== undefined) {
    await syncReviewStatsForProduct(req.payload, req, nextId)
  }

  return doc
}

export const syncStatsAfterReviewDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
  const id = resolveProductId((doc as { product?: unknown })?.product)

  if (req.payload && id !== undefined) {
    await syncReviewStatsForProduct(req.payload, req, id)
  }

  return doc
}
