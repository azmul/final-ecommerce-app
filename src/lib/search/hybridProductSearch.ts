import { createEmbedding, vectorSearchProductIds } from '@/lib/ai/embeddings'
import { formatAiProduct, rankAiProducts } from '@/lib/ai/formatProduct'
import { buildProductSearchDocument } from '@/lib/ai/productDocument'
import { logAiQuery } from '@/lib/ai/queryLog'
import { buildPublishedProductWhere } from '@/lib/search/productSearch'
import {
  passesVectorRelevanceThreshold,
  scoreProductTextRelevance,
} from '@/lib/search/productRelevance'
import type { Product, Variant } from '@/payload-types'
import type { Payload, Where } from 'payload'

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

export type HybridSearchFilters = {
  brandId?: string
  categoryId?: string
  inStockOnly?: boolean
  maxPrice?: number
  minPrice?: number
  subcategoryId?: string
}

export async function hybridProductSearch(args: {
  filters?: HybridSearchFilters
  limit?: number
  payload: Payload
  query: string
}): Promise<{ aiMatched: boolean; productIds: number[]; vectorScores: Map<number, number> }> {
  const query = args.query.trim()
  const limit = Math.min(Math.max(args.limit ?? 24, 1), 48)
  if (!query) return { aiMatched: false, productIds: [], vectorScores: new Map() }

  const filterWhere = buildPublishedProductWhere({
    brandId: args.filters?.brandId,
    categoryId: args.filters?.categoryId,
    inStockOnly: args.filters?.inStockOnly,
    maxPrice: args.filters?.maxPrice,
    minPrice: args.filters?.minPrice,
    searchValue: query,
    subcategoryId: args.filters?.subcategoryId,
  })

  const textResults = await args.payload.find({
    collection: 'products',
    depth: 0,
    draft: false,
    limit: limit,
    overrideAccess: false,
    where: filterWhere,
  })

  const textIds = textResults.docs.map((doc) => doc.id)
  if (textIds.length >= limit) {
    return { aiMatched: false, productIds: textIds, vectorScores: new Map() }
  }

  const embedding = await createEmbedding(query)
  if (!embedding) {
    return { aiMatched: false, productIds: textIds, vectorScores: new Map() }
  }

  const vectorHits = (
    await vectorSearchProductIds({
      limit: Math.max(limit * 2, 50),
      payload: args.payload,
      queryEmbedding: embedding,
    })
  ).filter((hit) => passesVectorRelevanceThreshold(hit.score))

  let candidateIds = vectorHits.map((hit) => hit.productId)

  if (args.filters && Object.values(args.filters).some(Boolean)) {
    const extraWhere: Where = { and: [{ id: { in: candidateIds } }] }
    const filterOnly = buildPublishedProductWhere({
      brandId: args.filters.brandId,
      categoryId: args.filters.categoryId,
      inStockOnly: args.filters.inStockOnly,
      maxPrice: args.filters.maxPrice,
      minPrice: args.filters.minPrice,
      subcategoryId: args.filters.subcategoryId,
    })

    if (filterOnly.and) {
      extraWhere.and = [...(extraWhere.and as Where[]), ...(filterOnly.and as Where[])]
    }

    const filtered = await args.payload.find({
      collection: 'products',
      depth: 0,
      draft: false,
      limit: limit * 2,
      overrideAccess: false,
      where: extraWhere,
    })

    candidateIds = filtered.docs.map((doc) => doc.id)
  }

  const vectorScores = new Map(vectorHits.map((hit) => [hit.productId, hit.score]))
  const merged = [...new Set([...textIds, ...candidateIds])].slice(0, limit)
  return { aiMatched: merged.length > textIds.length, productIds: merged, vectorScores }
}

export async function hybridProductSearchFormatted(args: {
  filters?: HybridSearchFilters
  limit?: number
  payload: Payload
  query: string
}) {
  const started = Date.now()
  const { aiMatched, productIds, vectorScores } = await hybridProductSearch(args)

  if (!productIds.length) {
    await logAiQuery(args.payload, {
      latencyMs: Date.now() - started,
      queryText: args.query,
      queryType: 'hybrid_search',
      resultsCount: 0,
    })
    return { aiMatched, products: [] }
  }

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

  const variantsByProduct = await fetchVariantsForProducts(args.payload, productIds)
  const order = new Map(productIds.map((id, index) => [id, index]))

  const formatted = rankAiProducts(
    (products.docs as Product[]).map((product) => {
      const variants = variantsByProduct.get(product.id) ?? []
      const searchText = buildProductSearchDocument(product, variants)
      const textScore = scoreProductTextRelevance(searchText, args.query) * 10
      const vectorScore = vectorScores.get(product.id)
      const relevanceScore =
        vectorScore != null ? Math.max(textScore, vectorScore * 10) : textScore

      return formatAiProduct({ product, relevanceScore, variants })
    }),
  ).sort((a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999))

  await logAiQuery(args.payload, {
    latencyMs: Date.now() - started,
    queryText: args.query,
    queryType: 'hybrid_search',
    resultsCount: formatted.length,
  })

  return { aiMatched, products: formatted }
}
