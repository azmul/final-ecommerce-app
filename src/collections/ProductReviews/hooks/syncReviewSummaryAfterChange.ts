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

  const payload = req.payload

  // Fire-and-forget: an LLM summary call must not block (or fail) the review
  // write. Errors are logged, not propagated. For stricter delivery guarantees
  // move this to a Payload Jobs task.
  const productIds = new Set<number>()
  if (prevId !== undefined && prevId !== nextId) productIds.add(prevId)
  if (nextId !== undefined) productIds.add(nextId)

  for (const productId of productIds) {
    void syncProductReviewSummary({ payload, productId }).catch((err) => {
      payload.logger.error({ err, msg: 'sync-review-summary', productId })
    })
  }

  return doc
}
