import { AI_PRODUCT_SEARCH_LIMIT } from '@/lib/ai/config'
import { createEmbedding, vectorSearchProductIds } from '@/lib/ai/embeddings'
import { buildProductSearchDocument } from '@/lib/ai/productDocument'
import { formatAiProduct, rankAiProducts } from '@/lib/ai/formatProduct'
import type { SemanticSearchRequest, SemanticSearchResponse } from '@/lib/ai/types'
import type { Product, Variant } from '@/payload-types'
import type { Payload } from 'payload'

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2)
}

function textRelevanceScore(searchText: string, query: string): number {
  const tokens = tokenize(query)
  if (!tokens.length) return 0

  const haystack = searchText.toLowerCase()
  let score = 0

  for (const token of tokens) {
    if (haystack.includes(token)) score += 2
  }

  if (haystack.includes(query.toLowerCase())) score += 4
  return score
}

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
  const result = await payload.find({
    collection: 'products',
    depth: 2,
    draft: false,
    limit: 100,
    overrideAccess: true,
    where: {
      and: [
        { _status: { equals: 'published' } },
        {
          or: [
            { title: { like: query } },
            { slug: { like: query } },
          ],
        },
      ],
    },
  })

  let docs = result.docs as Product[]

  if (!docs.length) {
    const broad = await payload.find({
      collection: 'products',
      depth: 2,
      draft: false,
      limit: 100,
      overrideAccess: true,
      sort: '-reviewAverageRating',
      where: {
        _status: {
          equals: 'published',
        },
      },
    })
    docs = broad.docs as Product[]
  }

  const productIds = docs.map((doc) => doc.id)
  const variantsByProduct = await fetchVariantsForProducts(payload, productIds)

  const scored = docs
    .map((product) => {
      const variants = variantsByProduct.get(product.id) ?? []
      const searchText = buildProductSearchDocument(product, variants)
      return {
        product,
        relevanceScore: textRelevanceScore(searchText, query),
        variants,
      }
    })
    .filter((entry) => entry.relevanceScore > 0)
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

    if (matches.length) {
      const products: ReturnType<typeof formatAiProduct>[] = []
      const variantsByProduct = await fetchVariantsForProducts(
        payload,
        matches.map((match) => match.productId),
      )

      for (const match of matches) {
        const product = (await payload.findByID({
          collection: 'products',
          depth: 2,
          id: match.productId,
          overrideAccess: true,
        }).catch(() => null)) as Product | null

        if (!product || product._status !== 'published') continue

        const variants = variantsByProduct.get(product.id) ?? []
        products.push(
          formatAiProduct({
            product,
            relevanceScore: match.score,
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
