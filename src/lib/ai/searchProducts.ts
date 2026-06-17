import { AI_PRODUCT_SEARCH_LIMIT } from '@/lib/ai/config'
import { createEmbedding, vectorSearchProductIds } from '@/lib/ai/embeddings'
import { formatAiProduct, rankAiProducts } from '@/lib/ai/formatProduct'
import { buildProductSearchDocument } from '@/lib/ai/productDocument'
import type { AiProductResult, ProductSearchFilters, ProductSearchResponse } from '@/lib/ai/types'
import {
  buildProductTextSearchWhere,
  getProductSearchRelevanceConfig,
  passesTextRelevanceThreshold,
  passesVectorRelevanceThreshold,
  scoreProductTextRelevance,
} from '@/lib/search/productRelevance'
import type { Product, Variant, VariantOption } from '@/payload-types'
import type { Payload, Where } from 'payload'

async function resolveBrandId(payload: Payload, brand?: string): Promise<number | null> {
  if (!brand?.trim()) return null

  const result = await payload.find({
    collection: 'brands',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: {
      or: [{ title: { like: brand } }, { slug: { like: brand } }],
    },
  })

  const id = result.docs[0]?.id
  return typeof id === 'number' ? id : null
}

async function resolveCategoryIds(payload: Payload, category?: string): Promise<number[]> {
  if (!category?.trim()) return []

  const [categories, subcategories] = await Promise.all([
    payload.find({
      collection: 'categories',
      depth: 0,
      limit: 5,
      overrideAccess: true,
      where: {
        or: [{ title: { like: category } }, { slug: { like: category } }],
      },
    }),
    payload.find({
      collection: 'subcategories',
      depth: 0,
      limit: 5,
      overrideAccess: true,
      where: {
        or: [{ title: { like: category } }, { slug: { like: category } }],
      },
    }),
  ])

  return [...categories.docs, ...subcategories.docs]
    .map((doc) => doc.id)
    .filter((id): id is number => typeof id === 'number')
}

async function resolveVariantOptionIds(
  payload: Payload,
  args: { color?: string; size?: string; material?: string; gender?: string },
): Promise<number[]> {
  const terms = [args.color, args.size, args.material, args.gender].filter(Boolean) as string[]
  if (!terms.length) return []

  const optionIds = new Set<number>()
  const optionPromises: ReturnType<typeof payload.find>[] = []

  for (const term of terms) {
    optionPromises.push(
      payload.find({
        collection: 'variantOptions',
        depth: 1,
        limit: 20,
        overrideAccess: true,
        where: {
          or: [{ label: { like: term } }, { value: { like: term } }],
        },
      }),
    )
  }

  const optionResults = await Promise.all(optionPromises)

  for (const options of optionResults) {
    for (const option of options.docs) {
      if (typeof option.id === 'number') optionIds.add(option.id)
    }
  }

  return [...optionIds]
}

async function resolveProductIdsFromVariants(
  payload: Payload,
  optionIds: number[],
): Promise<number[]> {
  if (!optionIds.length) return []

  const variants = await payload.find({
    collection: 'variants',
    depth: 0,
    limit: 200,
    overrideAccess: true,
    where: {
      options: {
        in: optionIds,
      },
    },
  })

  const productIds = new Set<number>()
  for (const variant of variants.docs as Variant[]) {
    const productId =
      typeof variant.product === 'object' && variant.product
        ? variant.product.id
        : variant.product
    if (typeof productId === 'number') productIds.add(productId)
  }

  return [...productIds]
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

function scoreProductMatch(
  product: Product,
  filters: ProductSearchFilters,
  variants: Variant[],
  searchText?: string,
): number {
  const query = filters.query?.trim() ?? ''
  let score = query && searchText ? scoreProductTextRelevance(searchText, query) * 10 : 0

  if (query && product.title.toLowerCase().includes(query.toLowerCase())) score += 3

  for (const term of [filters.color, filters.size, filters.material, filters.gender, filters.category]) {
    if (!term) continue
    const lower = term.toLowerCase()
    if (product.title.toLowerCase().includes(lower)) score += 2
  }

  for (const variant of variants) {
    for (const option of variant.options ?? []) {
      if (typeof option !== 'object' || !option) continue
      const opt = option as VariantOption
      const hay = `${opt.label} ${opt.value}`.toLowerCase()
      for (const term of [filters.color, filters.size, filters.material, filters.gender]) {
        if (term && hay.includes(term.toLowerCase())) score += 3
      }
    }
  }

  if (filters.inStockOnly && (product.inventory ?? 0) > 0) score += 1
  if (product.reviewAverageRating) score += product.reviewAverageRating * 0.2

  return score
}

export async function searchProductsForAi(
  payload: Payload,
  filters: ProductSearchFilters,
): Promise<ProductSearchResponse> {
  const limit = Math.min(filters.limit ?? AI_PRODUCT_SEARCH_LIMIT, AI_PRODUCT_SEARCH_LIMIT)
  const and: Where[] = [
    {
      _status: {
        equals: 'published',
      },
    },
  ]

  const brandId = await resolveBrandId(payload, filters.brand)
  if (brandId) {
    and.push({ brand: { equals: brandId } })
  }

  const categoryIds = await resolveCategoryIds(payload, filters.category ?? filters.gender)
  if (categoryIds.length) {
    and.push({
      or: [
        { categories: { in: categoryIds } },
        { subcategories: { in: categoryIds } },
      ],
    })
  }

  const searchValue = filters.query?.trim() ?? ''
  const textSearch = buildProductTextSearchWhere(searchValue)
  const structuredAnd = [...and]
  if (textSearch) {
    and.push(textSearch)
  }

  if (typeof filters.minPrice === 'number') {
    and.push({ priceInBDT: { greater_than_equal: filters.minPrice } })
  }

  if (typeof filters.maxPrice === 'number') {
    and.push({ priceInBDT: { less_than_equal: filters.maxPrice } })
  }

  if (filters.inStockOnly) {
    and.push({
      or: [
        {
          and: [{ enableVariants: { equals: false } }, { inventory: { greater_than: 0 } }],
        },
        { enableVariants: { equals: true } },
      ],
    })
  }

  const optionIds = await resolveVariantOptionIds(payload, {
    color: filters.color,
    gender: filters.gender,
    material: filters.material,
    size: filters.size,
  })
  const variantProductIds = await resolveProductIdsFromVariants(payload, optionIds)
  if (variantProductIds.length) {
    and.push({ id: { in: variantProductIds } })
  }

  const relevanceConfig = getProductSearchRelevanceConfig()
  const candidateLimit = searchValue
    ? Math.min(limit * relevanceConfig.candidateMultiplier, relevanceConfig.maxCandidates)
    : limit

  let result = await payload.find({
    collection: 'products',
    depth: 2,
    draft: false,
    limit: candidateLimit,
    overrideAccess: true,
    sort: '-reviewAverageRating',
    where: { and },
  })

  let relaxedFilters: string[] | undefined

  if (!result.docs.length && filters.maxPrice) {
    relaxedFilters = ['maxPrice']
    const relaxedAnd = and.filter(
      (clause) => !('priceInBDT' in clause && 'less_than_equal' in (clause.priceInBDT as object)),
    )
    result = await payload.find({
      collection: 'products',
      depth: 2,
      draft: false,
      limit: candidateLimit,
      overrideAccess: true,
      sort: '-reviewAverageRating',
      where: { and: relaxedAnd },
    })
  }

  const vectorScores = new Map<number, number>()

  if (searchValue && result.docs.length < limit) {
    const embedding = await createEmbedding(searchValue)
    if (embedding?.length) {
      const vectorHits = await vectorSearchProductIds({
        limit: candidateLimit,
        payload,
        queryEmbedding: embedding,
      })

      const relevantHits = vectorHits.filter((hit) => passesVectorRelevanceThreshold(hit.score))
      const existingIds = new Set(result.docs.map((doc) => doc.id))
      const missingIds = relevantHits
        .map((hit) => hit.productId)
        .filter((id) => !existingIds.has(id))

      if (missingIds.length) {
        const vectorWhere: Where = {
          and: [{ id: { in: missingIds } }, ...structuredAnd],
        }

        const vectorMatches = await payload.find({
          collection: 'products',
          depth: 2,
          draft: false,
          limit: missingIds.length,
          overrideAccess: true,
          where: vectorWhere,
        })

        for (const hit of relevantHits) {
          vectorScores.set(hit.productId, hit.score)
        }

        result = {
          ...result,
          docs: [...result.docs, ...vectorMatches.docs],
        }
      }
    }
  }

  const productIds = result.docs.map((doc) => doc.id)
  const variantsByProduct = await fetchVariantsForProducts(payload, productIds)

  const products: AiProductResult[] = result.docs
    .map((doc) => {
      const product = doc as Product
      const variants = variantsByProduct.get(product.id) ?? []
      const vectorScore = vectorScores.get(product.id)
      const searchText = buildProductSearchDocument(product, variants)
      const textScore = scoreProductMatch(product, filters, variants, searchText)
      const relevanceScore = vectorScore != null ? Math.max(textScore, vectorScore * 10) : textScore

      return formatAiProduct({
        product,
        relevanceScore,
        variants,
      })
    })
    .filter((product) => {
      if (!searchValue) return true
      const normalizedScore = (product.relevanceScore ?? 0) / 10
      return passesTextRelevanceThreshold(normalizedScore, searchValue) || vectorScores.has(product.id)
    })

  const ranked = rankAiProducts(products).slice(0, limit)

  return {
    filtersApplied: filters,
    products: ranked,
    relaxedFilters,
    total: ranked.length,
  }
}
