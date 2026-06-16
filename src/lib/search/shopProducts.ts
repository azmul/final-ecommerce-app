import { buildPublishedProductWhere } from '@/lib/search/productSearch'
import { resolveProductIdsForVariantOptions } from '@/lib/search/variantOptionFacets'
import { hybridProductSearch } from '@/lib/search/hybridProductSearch'
import type { Product } from '@/payload-types'
import type { Payload, Where } from 'payload'

export const SHOP_PRODUCTS_PER_PAGE = 24

export const shopProductListSelect = {
  title: true,
  slug: true,
  gallery: true,
  categories: true,
  priceInBDT: true,
  discountPercentage: true,
  enableVariants: true,
  inventory: true,
  productBadge: true,
} as const

export type ShopListingFilters = {
  badge?: string
  brandId?: string
  /** Resolved category id (e.g. `/shop/honey`). */
  categoryId?: string
  /** Category slug from the URL — used for listing identity and API fallback. */
  categorySlug?: string
  inStockOnly?: boolean
  maxPrice?: number
  minPrice?: number
  searchValue?: string
  sort?: string
  subcategoryId?: string
  variantOptionIds?: number[]
  view?: 'comfortable' | 'compact' | 'default'
}

export type ShopProductsQuery = ShopListingFilters & {
  page?: number
  limit?: number
}

/** Stable key for resetting infinite scroll when the shop listing context changes. */
export function buildShopListingKey(filters: ShopListingFilters): string {
  return JSON.stringify({
    badge: filters.badge ?? '',
    brandId: filters.brandId ?? '',
    categoryId: filters.categoryId ?? '',
    categorySlug: filters.categorySlug ?? '',
    inStockOnly: filters.inStockOnly ?? false,
    maxPrice: filters.maxPrice ?? null,
    minPrice: filters.minPrice ?? null,
    searchValue: filters.searchValue ?? '',
    sort: filters.sort ?? '',
    subcategoryId: filters.subcategoryId ?? '',
    variantOptionIds: filters.variantOptionIds ?? [],
  })
}

export function shopProductsHasFilters(query: ShopProductsQuery): boolean {
  return Boolean(
    query.searchValue ||
      query.categoryId ||
      query.subcategoryId ||
      query.brandId ||
      query.badge ||
      query.inStockOnly ||
      query.minPrice != null ||
      query.maxPrice != null ||
      (query.variantOptionIds?.length ?? 0) > 0,
  )
}

export async function buildShopProductsWhere(
  payload: Payload,
  query: ShopProductsQuery,
): Promise<Where | undefined> {
  if (!shopProductsHasFilters(query)) return undefined

  const and: Where[] = []

  const base = buildPublishedProductWhere({
    badge: query.badge,
    brandId: query.brandId,
    categoryId: query.categoryId,
    inStockOnly: query.inStockOnly,
    maxPrice: query.maxPrice,
    minPrice: query.minPrice,
    searchValue: query.searchValue,
    subcategoryId: query.subcategoryId,
  })

  if (base?.and && Array.isArray(base.and)) {
    and.push(...base.and)
  } else {
    and.push({ _status: { equals: 'published' } })
  }

  if (query.variantOptionIds?.length) {
    const productIds = await resolveProductIdsForVariantOptions(payload, query.variantOptionIds)
    if (!productIds.length) {
      return { id: { equals: -1 } }
    }
    and.push({ id: { in: productIds } })
  }

  return { and }
}

export async function resolveShopCategoryId(
  payload: Payload,
  query: Pick<ShopProductsQuery, 'categoryId' | 'categorySlug'>,
): Promise<string | undefined> {
  if (query.categoryId) return query.categoryId

  const slug = query.categorySlug?.trim()
  if (!slug) return undefined

  const found = await payload.find({
    collection: 'categories',
    depth: 0,
    limit: 1,
    overrideAccess: false,
    where: { slug: { equals: slug } },
  })

  const id = found.docs[0]?.id
  return id != null ? String(id) : undefined
}

export async function fetchShopProducts(payload: Payload, query: ShopProductsQuery) {
  const page = query.page && query.page > 0 ? query.page : 1
  const limit =
    query.limit && query.limit > 0 ? Math.min(Math.floor(query.limit), 48) : SHOP_PRODUCTS_PER_PAGE

  const categoryId = await resolveShopCategoryId(payload, query)
  const resolvedQuery: ShopProductsQuery = { ...query, categoryId }

  if (resolvedQuery.searchValue?.trim()) {
    const hybrid = await hybridProductSearch({
      filters: {
        badge: resolvedQuery.badge,
        brandId: resolvedQuery.brandId,
        categoryId: resolvedQuery.categoryId,
        inStockOnly: resolvedQuery.inStockOnly,
        maxPrice: resolvedQuery.maxPrice,
        minPrice: resolvedQuery.minPrice,
        subcategoryId: resolvedQuery.subcategoryId,
      },
      limit: page * limit,
      payload,
      query: resolvedQuery.searchValue.trim(),
    })

    const start = (page - 1) * limit
    const pageIds = hybrid.productIds.slice(start, start + limit)

    if (!pageIds.length) {
      return {
        docs: [],
        hasNextPage: false,
        limit,
        page,
        totalDocs: hybrid.productIds.length,
      }
    }

    const result = await payload.find({
      collection: 'products',
      depth: 1,
      draft: false,
      limit: pageIds.length,
      overrideAccess: false,
      pagination: false,
      select: shopProductListSelect,
      where: {
        and: [{ id: { in: pageIds } }, { _status: { equals: 'published' } }],
      },
    })

    const order = new Map(pageIds.map((id, index) => [id, index]))
    const docs = [...result.docs].sort(
      (a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999),
    ) as ShopProductListItem[]

    return {
      docs,
      hasNextPage: start + limit < hybrid.productIds.length,
      limit,
      page,
      totalDocs: hybrid.productIds.length,
    }
  }

  const where = await buildShopProductsWhere(payload, resolvedQuery)

  return payload.find({
    collection: 'products',
    depth: 1,
    draft: false,
    limit,
    overrideAccess: false,
    page,
    select: shopProductListSelect,
    ...(query.sort ? { sort: query.sort } : { sort: 'title' }),
    ...(where ? { where } : {}),
  })
}

export type ShopProductListItem = Pick<
  Product,
  | 'id'
  | 'title'
  | 'slug'
  | 'gallery'
  | 'categories'
  | 'priceInBDT'
  | 'discountPercentage'
  | 'enableVariants'
  | 'inventory'
  | 'productBadge'
>
