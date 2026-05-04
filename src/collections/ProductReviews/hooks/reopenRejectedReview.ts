import type { CollectionBeforeChangeHook } from 'payload'

import { checkRole } from '@/access/utilities'
import { customerHasPurchasedProduct } from '@/collections/ProductReviews/customerHasPurchasedProduct'

type ReviewBaseline = {
  moderationStatus?: 'pending' | 'approved' | 'rejected' | null
  product?: unknown
}

/** After a substantive edit, rejected reviews automatically return to moderation. */
export const reopenRejectedReview: CollectionBeforeChangeHook = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  if (operation !== 'update' || !req?.payload || !req.user) {
    return data
  }

  if (checkRole(['admin'], req.user)) {
    return data
  }

  const previous = originalDoc as ReviewBaseline | undefined

  if (previous?.moderationStatus !== 'rejected') {
    return data
  }

  const productIdRaw = data?.product ?? previous.product
  const productId =
    typeof productIdRaw === 'object' && productIdRaw !== null && 'id' in productIdRaw ?
      (productIdRaw as { id: number }).id
    : productIdRaw

  let verifiedPurchase: boolean | undefined

  if (typeof productId === 'number' || typeof productId === 'string') {
    verifiedPurchase = await customerHasPurchasedProduct(req.payload, req, req.user.id, productId)
  }

  return {
    ...data,
    ...(typeof verifiedPurchase === 'boolean' ? { verifiedPurchase } : {}),
    moderatorNote: null,
    moderationStatus: 'pending',
  }
}
