import { getProductEmbeddingVector, vectorSearchProductIds } from '@/lib/ai/embeddings'
import { formatAiProduct, rankAiProducts } from '@/lib/ai/formatProduct'
import { getProductAffinityIds } from '@/lib/ai/productAffinity'
import type { AiProductResult } from '@/lib/ai/types'
import type { Product } from '@/payload-types'
import type { Payload } from 'payload'

export type RecommendationContext = 'homepage' | 'pdp' | 'cart'

export async function fetchRecommendationsForAi(
  payload: Payload,
  args: {
    cartId?: number
    context: RecommendationContext
    limit?: number
    productId?: number
    userId?: number
  },
): Promise<{ products: AiProductResult[] }> {
  const limit = Math.min(Math.max(args.limit ?? 8, 1), 20)
  const scores = new Map<number, number>()

  const bump = (id: number, weight: number) => {
    scores.set(id, (scores.get(id) ?? 0) + weight)
  }

  if (args.userId) {
    const orders = await payload.find({
      collection: 'orders',
      depth: 0,
      limit: 10,
      overrideAccess: true,
      sort: '-createdAt',
      where: { customer: { equals: args.userId } },
    })

    for (const order of orders.docs) {
      for (const item of order.items ?? []) {
        const product = item.product
        const pid =
          typeof product === 'object' && product && 'id' in product ?
            Number(product.id)
          : typeof product === 'number' ?
            product
          : null
        if (pid) bump(pid, 0.15)
      }
    }

    const wishlist = await payload.find({
      collection: 'wishlists',
      depth: 1,
      limit: 1,
      overrideAccess: true,
      where: { customer: { equals: args.userId } },
    })

    for (const productId of wishlist.docs[0]?.products ?? []) {
      const pid =
        typeof productId === 'object' && productId ?
          Number(productId.id)
        : typeof productId === 'number' ?
          productId
        : null
      if (pid) bump(pid, 0.25)
    }

    const recent = await payload.find({
      collection: 'recently-viewed',
      depth: 0,
      limit: 12,
      overrideAccess: true,
      sort: '-updatedAt',
      where: { user: { equals: args.userId } },
    })

    for (const row of recent.docs) {
      const pid = typeof row.product === 'number' ? row.product : null
      if (pid) bump(pid, 0.2)
    }
  }

  if (args.context === 'pdp' && args.productId) {
    const affinity = await getProductAffinityIds(payload, args.productId, 8)
    for (const [index, id] of affinity.entries()) {
      bump(id, 0.35 - index * 0.03)
    }

    const productEmbedding = await getProductEmbeddingVector({
      payload,
      productId: args.productId,
    })

    if (productEmbedding?.length) {
      const embeddingMatches = await vectorSearchProductIds({
        limit: 8,
        payload,
        queryEmbedding: productEmbedding,
      })
      for (const match of embeddingMatches) {
        if (match.productId !== args.productId) bump(match.productId, match.score * 0.4)
      }
    }
  }

  if (args.context === 'cart' && args.cartId) {
    const cart = await payload.findByID({
      collection: 'carts',
      depth: 1,
      id: args.cartId,
      overrideAccess: true,
    })

    for (const item of cart?.items ?? []) {
      const pid =
        typeof item.product === 'object' && item.product ?
          Number(item.product.id)
        : typeof item.product === 'number' ?
          item.product
        : null
      if (!pid) continue

      const affinity = await getProductAffinityIds(payload, pid, 4)
      for (const [index, id] of affinity.entries()) {
        bump(id, 0.3 - index * 0.04)
      }
    }
  }

  if (scores.size === 0) {
    const popular = await payload.find({
      collection: 'products',
      depth: 0,
      draft: false,
      limit,
      overrideAccess: false,
      sort: '-reviewCount',
      where: { _status: { equals: 'published' } },
    })

    for (const [index, doc] of popular.docs.entries()) {
      bump(doc.id, 1 - index * 0.05)
    }
  }

  const rankedIds = [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit * 2)
    .map(([id]) => id)

  if (!rankedIds.length) return { products: [] }

  const products = await payload.find({
    collection: 'products',
    depth: 2,
    draft: false,
    limit: limit * 2,
    overrideAccess: false,
    where: {
      and: [{ id: { in: rankedIds } }, { _status: { equals: 'published' } }],
    },
  })

  const formatted = rankAiProducts(
    products.docs.map((doc) =>
      formatAiProduct({ product: doc as Product, variants: [] }),
    ),
  ).slice(0, limit)

  return { products: formatted }
}
