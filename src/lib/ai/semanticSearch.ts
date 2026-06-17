import { AI_PRODUCT_SEARCH_LIMIT } from '@/lib/ai/config'
import { createEmbedding, vectorSearchProductIds } from '@/lib/ai/embeddings'
import { buildProductSearchDocument } from '@/lib/ai/productDocument'
import { formatAiProduct, rankAiProducts } from '@/lib/ai/formatProduct'
import type { SemanticSearchRequest, SemanticSearchResponse } from '@/lib/ai/types'
import {
  buildProductTextSearchWhere,
  getProductSearchRelevanceConfig,
  passesTextRelevanceThreshold,
  passesVectorRelevanceThreshold,
  scoreProductTextRelevance,
} from '@/lib/search/productRelevance'
import type { Product, Variant } from '@/payload-types'
import type { Payload } from 'payload'

async function fetchVariantsForProducts(payload: Payload, productIds: number[]) {
  if (!productIds.length) return new Map<number, Variant[]>()

  const variants = await payload.find({
    collection: 'variants',
    depth: 1,
    limit: 500,
    overrideAccess: true,
    where: {
      product: {
        in: productIds,
      },
    },
  })

  const map = new Map<number, Variant[]>()
  for (const variant of variants.docs as Variant[]) {
    const productId =
      typeof variant.product === 'object' && variant.product
        ? variant.product.id
        : variant.product
    if (typeof productId !== 'number') continue
    const list = map.get(productId) ?? []
    list.push(variant)
    map.set(productId, list)
  }

  return map
}

async function textSemanticSearch(
  payload: Payload,
  query: string,
  limit: number,
): Promise<SemanticSearchResponse> {
  const relevanceConfig = getProductSearchRelevanceConfig()
  const textSearch = buildProductTextSearchWhere(query)
  const where = {
    and: [{ _status: { equals: 'published' as const } }, ...(textSearch ? [textSearch] : [])],
  }

  const result = await payload.find({
    collection: 'products',
    depth: 2,
    draft: false,
    limit: relevanceConfig.maxCandidates,
    overrideAccess: true,
    sort: '-reviewAverageRating',
    where,
  })

  const docs = result.docs as Product[]
  const productIds = docs.map((doc) => doc.id)
  const variantsByProduct = await fetchVariantsForProducts(payload, productIds)

  const scored = docs
    .map((product) => {
      const variants = variantsByProduct.get(product.id) ?? []
      const searchText = buildProductSearchDocument(product, variants)
      const relevanceScore = scoreProductTextRelevance(searchText, query) * 10
      return {
        product,
        relevanceScore,
        variants,
      }
    })
    .filter((entry) => passesTextRelevanceThreshold(entry.relevanceScore / 10, query))
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, limit)

  const products = scored.map((entry) =>
    formatAiProduct({
      product: entry.product,
      relevanceScore: entry.relevanceScore,
      variants: entry.variants,
    }),
  )

  return {
    method: 'text',
    products: rankAiProducts(products),
    total: products.length,
  }
}

export async function semanticSearchForAi(
  payload: Payload,
  input: SemanticSearchRequest,
): Promise<SemanticSearchResponse> {
  const query = input.query?.trim()
  if (!query) {
    return { method: 'text', products: [], total: 0 }
  }

  const limit = Math.min(input.limit ?? AI_PRODUCT_SEARCH_LIMIT, AI_PRODUCT_SEARCH_LIMIT)
  const embedding = await createEmbedding(query)

  if (embedding?.length) {
    const matches = await vectorSearchProductIds({
      limit,
      payload,
      queryEmbedding: embedding,
    })

    const relevantMatches = matches.filter((match) => passesVectorRelevanceThreshold(match.score))

    if (relevantMatches.length) {
      const productIds = relevantMatches.map((match) => match.productId)
      const variantsByProduct = await fetchVariantsForProducts(payload, productIds)

      const productResult = await payload.find({
        collection: 'products',
        depth: 2,
        draft: false,
        limit: productIds.length,
        overrideAccess: true,
        where: {
          and: [{ id: { in: productIds } }, { _status: { equals: 'published' } }],
        },
      })

      const productById = new Map(
        (productResult.docs as Product[]).map((product) => [product.id, product]),
      )

      const products: ReturnType<typeof formatAiProduct>[] = []

      for (const match of relevantMatches) {
        const product = productById.get(match.productId)
        if (!product) continue

        const variants = variantsByProduct.get(product.id) ?? []
        products.push(
          formatAiProduct({
            product,
            relevanceScore: match.score * 10,
            variants,
          }),
        )
      }

      if (products.length) {
        return {
          method: 'vector',
          products: rankAiProducts(products),
          total: products.length,
        }
      }
    }
  }

  return textSemanticSearch(payload, query, limit)
}
