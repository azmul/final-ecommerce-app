import type { CollectionBeforeValidateHook } from 'payload'

import { APIError } from 'payload'

import { checkRole } from '@/access/utilities'
import { customerHasPurchasedProduct } from '@/collections/ProductReviews/customerHasPurchasedProduct'

const productIdFromData = (raw: unknown): number | string | undefined => {
  if (raw === undefined || raw === null) return undefined

  if (typeof raw === 'object' && raw !== null && 'id' in raw) {
    const id = (raw as { id?: number | string }).id
    return id === undefined || id === null ? undefined : id
  }

  return raw as number | string
}

export const prepareProductReviewDraft: CollectionBeforeValidateHook = async ({
  data,
  operation,
  req,
}) => {
  if (!data || typeof data !== 'object') return data

  const base = data as Record<string, unknown>

  if (operation === 'update') {
    if (typeof base.body === 'string') {
      base.body = base.body.trim()
    }

    if (typeof base.title === 'string') {
      base.title = base.title.trim() || undefined
    }

    if (req?.user && !checkRole(['admin'], req.user)) {
      const reviewerName =
        typeof req.user === 'object' && req.user && 'name' in req.user
          ? String((req.user as { name?: string | null }).name || '').trim()
          : ''

      const reviewerEmail =
        typeof req.user === 'object' && req.user && 'email' in req.user
          ? String((req.user as { email?: string | null }).email || '').trim()
          : ''

      base.reviewerDisplayName =
        reviewerName ||
        (reviewerEmail.includes('@') ? reviewerEmail.split('@')[0] : reviewerEmail) ||
        'Verified customer'
    }

    return data
  }

  if (operation !== 'create') {
    return data
  }

  if (!req?.user || !req.payload) {
    throw new APIError('You must sign in to write a review.', 401)
  }

  if (typeof base.body === 'string') {
    base.body = base.body.trim()
  }

  if (typeof base.title === 'string') {
    base.title = base.title.trim() || undefined
  }

  base.author = req.user.id

  const reviewerName =
    typeof req.user === 'object' && req.user && 'name' in req.user
      ? String((req.user as { name?: string | null }).name || '').trim()
      : ''

  const reviewerEmail =
    typeof req.user === 'object' && req.user && 'email' in req.user
      ? String((req.user as { email?: string | null }).email || '').trim()
      : ''

  base.reviewerDisplayName =
    reviewerName ||
    (reviewerEmail.includes('@') ? reviewerEmail.split('@')[0] : reviewerEmail) ||
    'Verified customer'

  if (!checkRole(['admin'], req.user)) {
    base.moderationStatus = 'pending'
  }

  const productIdResolved = productIdFromData(base.product)

  if (productIdResolved === undefined || productIdResolved === null) {
    throw new APIError('Product is required for a review.', 400)
  }

  base.verifiedPurchase = await customerHasPurchasedProduct(
    req.payload,
    req,
    req.user.id,
    productIdResolved,
  )

  if (!checkRole(['admin'], req.user)) {
    const existing = await req.payload.find({
      collection: 'product-reviews',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      req,
      where: {
        and: [
          {
            product: {
              equals: productIdResolved,
            },
          },
          {
            author: {
              equals: req.user.id,
            },
          },
        ],
      },
    })

    const existingDoc = existing.docs?.[0] as { moderationStatus?: string } | undefined

    if (existingDoc?.moderationStatus === 'rejected') {
      throw new APIError(
        'Update your previous review instead of submitting a new one—we keep one review slot per shopper per item.',
        400,
      )
    }

    if (existingDoc) {
      throw new APIError('You already have a review awaiting approval or live on this product.', 400)
    }
  }

  return data
}
