import type { CollectionAfterChangeHook } from 'payload'

import { syncProductReviewSummary } from '@/lib/ai/generateReviewSummary'

export const syncReviewSummaryAfterReviewChange: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
}) => {
  if (!req.payload || req.context?.skipReviewSummary) return doc

  const resolveProductId = (product: unknown): number | undefined => {
    if (product === null || product === undefined) return undefined
    if (typeof product === 'object' && 'id' in product && typeof product.id === 'number') {
      return product.id
    }
    return typeof product === 'number' ? product : undefined
  }

  const nextId = resolveProductId((doc as { product?: unknown }).product)
  const prevId = resolveProductId((previousDoc as { product?: unknown })?.product)

  const approved =
    (doc as { moderationStatus?: string }).moderationStatus === 'approved' ||
    (previousDoc as { moderationStatus?: string } | undefined)?.moderationStatus === 'approved'

  if (!approved) return doc

  if (prevId !== undefined && prevId !== nextId) {
    await syncProductReviewSummary({ payload: req.payload, productId: prevId })
  }

  if (nextId !== undefined) {
    await syncProductReviewSummary({ payload: req.payload, productId: nextId })
  }

  return doc
}
