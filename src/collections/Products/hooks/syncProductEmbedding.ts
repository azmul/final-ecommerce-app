import type { CollectionAfterChangeHook } from 'payload'

import { createEmbedding, upsertProductEmbedding } from '@/lib/ai/embeddings'
import { buildProductSearchDocument } from '@/lib/ai/productDocument'
import { deferTask } from '@/lib/payload/deferTask'
import type { Product, Variant } from '@/payload-types'

export const syncProductEmbedding: CollectionAfterChangeHook = ({ doc, req }) => {
  if (!req?.payload || doc._status !== 'published') return
  if (req.context?.disableRevalidate || req.context?.skipProductEmbedding) return

  const payload = req.payload
  const product = doc as Product

  deferTask(payload, 'syncProductEmbedding', async () => {
    const variants = await payload.find({
      collection: 'variants',
      depth: 1,
      limit: 100,
      overrideAccess: true,
      where: {
        product: {
          equals: product.id,
        },
      },
    })

    const searchText = buildProductSearchDocument(product, variants.docs as Variant[])
    const embedding = await createEmbedding(searchText)

    await upsertProductEmbedding({
      embedding,
      payload,
      productId: product.id,
      searchText,
    })
  })
}
