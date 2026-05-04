import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  Payload,
  PayloadRequest,
} from 'payload'

import { revalidatePath } from 'next/cache'

type ProductRelation = number | { id?: number; slug?: string } | null | undefined

const resolveProductSlug = async (
  payload: Payload,
  productRef: ProductRelation,
  req: PayloadRequest,
): Promise<string | undefined> => {
  if (!productRef) return undefined

  if (typeof productRef === 'object' && productRef !== null && typeof productRef.slug === 'string') {
    return productRef.slug
  }

  const id = typeof productRef === 'object' && productRef !== null ? productRef.id : productRef

  if (id === undefined || id === null) return undefined

  const productDoc = await payload.findByID({
    collection: 'products',
    depth: 0,
    id,
    overrideAccess: true,
    req,
    select: {
      slug: true,
    },
  })

  return productDoc?.slug ?? undefined
}

const refreshShopPathsForProduct = async (
  payload: Payload,
  productRef: ProductRelation,
  req: PayloadRequest,
) => {
  const slug = await resolveProductSlug(payload, productRef, req)

  if (slug) {
    revalidatePath(`/products/${slug}`)
    revalidatePath(`/shop`)
  }
}

export const revalidateProductReviewPaths: CollectionAfterChangeHook = async ({ doc, req }) => {
  if (!req.context.disableProductReviewRevalidate && doc && typeof doc === 'object' && 'product' in doc) {
    await refreshShopPathsForProduct(req.payload, (doc as { product: ProductRelation }).product, req)
  }

  return doc
}

export const revalidateProductReviewPathsDelete: CollectionAfterDeleteHook = async ({
  doc,
  req,
}) => {
  if (!req.context.disableProductReviewRevalidate && doc && typeof doc === 'object' && 'product' in doc) {
    await refreshShopPathsForProduct(req.payload, (doc as { product: ProductRelation }).product, req)
  }

  return doc
}
