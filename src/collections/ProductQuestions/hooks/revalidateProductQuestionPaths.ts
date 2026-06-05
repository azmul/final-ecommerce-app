import type { CollectionAfterChangeHook } from 'payload'
import { revalidatePath } from 'next/cache'

export const revalidateProductQuestionPaths: CollectionAfterChangeHook = async ({ doc, req }) => {
  const product = doc.product
  const productId =
    typeof product === 'object' && product && 'id' in product ?
      product.id
    : product

  if (!productId || !Number.isFinite(Number(productId))) return doc

  const productDoc = await req.payload.findByID({
    id: Number(productId),
    collection: 'products',
    depth: 0,
    overrideAccess: true,
    req,
    select: { slug: true },
  })

  if (productDoc?.slug) {
    revalidatePath(`/products/${productDoc.slug}`)
  }

  return doc
}
