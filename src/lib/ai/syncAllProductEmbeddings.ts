import { getEmbeddingConfig } from '@/lib/ai/config'
import { createEmbeddings, upsertProductEmbedding } from '@/lib/ai/embeddings'
import { buildProductSearchDocument } from '@/lib/ai/productDocument'
import type { Product, Variant } from '@/payload-types'
import type { Payload } from 'payload'

const PAGE_SIZE = 25
const EMBEDDING_BATCH_SIZE = 20

async function fetchVariantsForProducts(payload: Payload, productIds: number[]) {
  if (!productIds.length) return new Map<number, Variant[]>()

  const variants = await payload.find({
    collection: 'variants',
    depth: 1,
    limit: 500,
    overrideAccess: true,
    where: { product: { in: productIds } },
  })

  const map = new Map<number, Variant[]>()
  for (const variant of variants.docs as Variant[]) {
    const productId =
      typeof variant.product === 'object' && variant.product ?
        variant.product.id
      : variant.product
    if (typeof productId !== 'number') continue
    const list = map.get(productId) ?? []
    list.push(variant)
    map.set(productId, list)
  }

  return map
}

export async function syncAllProductEmbeddings(
  payload: Payload,
): Promise<{ skipped: number; synced: number }> {
  if (!getEmbeddingConfig().enabled) {
    return { skipped: 0, synced: 0 }
  }

  let synced = 0
  let skipped = 0
  let page = 1

  while (true) {
    const result = await payload.find({
      collection: 'products',
      depth: 1,
      draft: false,
      limit: PAGE_SIZE,
      overrideAccess: true,
      page,
      where: { _status: { equals: 'published' } },
    })

    if (!result.docs.length) break

    const products = result.docs as Product[]
    const variantsByProduct = await fetchVariantsForProducts(
      payload,
      products.map((product) => product.id),
    )

    const rows = products.map((product) => ({
      product,
      searchText: buildProductSearchDocument(product, variantsByProduct.get(product.id) ?? []),
    }))

    for (let index = 0; index < rows.length; index += EMBEDDING_BATCH_SIZE) {
      const batch = rows.slice(index, index + EMBEDDING_BATCH_SIZE)
      const embeddings = await createEmbeddings(batch.map((row) => row.searchText))

      for (const [batchIndex, row] of batch.entries()) {
        const embedding = embeddings[batchIndex]
        if (!embedding?.length) {
          skipped += 1
          continue
        }

        await upsertProductEmbedding({
          embedding,
          payload,
          productId: row.product.id,
          searchText: row.searchText,
        })
        synced += 1
      }
    }

    if (!result.hasNextPage) break
    page += 1
  }

  return { skipped, synced }
}
