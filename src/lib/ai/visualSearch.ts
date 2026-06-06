import { createEmbedding, vectorSearchProductIds } from '@/lib/ai/embeddings'
import { getPostgresDrizzle } from '@/lib/ai/db'
import { formatAiProduct, rankAiProducts } from '@/lib/ai/formatProduct'
import { logAiQuery } from '@/lib/ai/queryLog'
import { sql } from '@payloadcms/db-postgres'
import type { Product, Variant } from '@/payload-types'
import type { Payload } from 'payload'

export async function upsertProductImageEmbedding(args: {
  embedding: number[] | null
  imageUrl: string
  payload: Payload
  productId: number
}): Promise<void> {
  const db = getPostgresDrizzle(args.payload)
  if (!db) return

  const embeddingValue = args.embedding?.length ? `[${args.embedding.join(',')}]` : null

  await db.execute(sql`
    INSERT INTO "product_image_embeddings" ("product_id", "image_url", "embedding", "updated_at")
    VALUES (${args.productId}, ${args.imageUrl}, ${embeddingValue}::vector, now())
    ON CONFLICT ("product_id") DO UPDATE SET
      "image_url" = EXCLUDED."image_url",
      "embedding" = EXCLUDED."embedding",
      "updated_at" = now()
  `)
}

export async function describeImageForSearch(_imageBase64: string, _mimeType: string): Promise<string | null> {
  // Vision captioning requires a multimodal model; callers may pass textHint instead.
  return null
}

export async function visualSearchProducts(args: {
  imageBase64: string
  limit?: number
  mimeType: string
  payload: Payload
  textHint?: string
}) {
  const started = Date.now()
  const description =
    args.textHint?.trim() || (await describeImageForSearch(args.imageBase64, args.mimeType))

  if (!description) {
    return { description: null, products: [] }
  }

  const embedding = await createEmbedding(description)
  if (!embedding) {
    return { description, products: [] }
  }

  const hits = await vectorSearchProductIds({
    limit: args.limit ?? 12,
    payload: args.payload,
    queryEmbedding: embedding,
  })

  if (!hits.length) {
    await logAiQuery(args.payload, {
      latencyMs: Date.now() - started,
      queryText: description,
      queryType: 'visual_search',
      resultsCount: 0,
    })
    return { description, products: [] }
  }

  const productIds = hits.map((hit) => hit.productId)
  const products = await args.payload.find({
    collection: 'products',
    depth: 2,
    draft: false,
    limit: productIds.length,
    overrideAccess: false,
    where: {
      and: [{ id: { in: productIds } }, { _status: { equals: 'published' } }],
    },
  })

  const variants = await args.payload.find({
    collection: 'variants',
    depth: 1,
    limit: 500,
    overrideAccess: true,
    where: { product: { in: productIds } },
  })

  const variantsByProduct = new Map<number, Variant[]>()
  for (const variant of variants.docs as Variant[]) {
    const productId =
      typeof variant.product === 'object' && variant.product ?
        variant.product.id
      : variant.product
    if (typeof productId !== 'number') continue
    const list = variantsByProduct.get(productId) ?? []
    list.push(variant)
    variantsByProduct.set(productId, list)
  }

  const formatted = rankAiProducts(
    (products.docs as Product[]).map((product) =>
      formatAiProduct({ product, variants: variantsByProduct.get(product.id) ?? [] }),
    ),
  )

  await logAiQuery(args.payload, {
    latencyMs: Date.now() - started,
    queryText: description,
    queryType: 'visual_search',
    resultsCount: formatted.length,
  })

  return { description, products: formatted }
}
