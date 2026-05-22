import { buildPublishedProductWhere } from '@/lib/search/productSearch'
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
}

export type ShopProductsQuery = ShopListingFilters & {
  page?: number
  limit?: number
}

/** Stable key for resetting infinite scroll when the shop listing context changes. */
export function buildShopListingKey(filters: ShopListingFilters): string {
  return JSON.stringify({
    brandId: filters.brandId ?? '',
    categoryId: filters.categoryId ?? '',
    categorySlug: filters.categorySlug ?? '',
    inStockOnly: filters.inStockOnly ?? false,
    maxPrice: filters.maxPrice ?? null,
    minPrice: filters.minPrice ?? null,
    searchValue: filters.searchValue ?? '',
    sort: filters.sort ?? '',
    subcategoryId: filters.subcategoryId ?? '',
  })
}

export function shopProductsHasFilters(query: ShopProductsQuery): boolean {
  return Boolean(
    query.searchValue ||
      query.categoryId ||
      query.subcategoryId ||
      query.brandId ||
      query.inStockOnly ||
      query.minPrice != null ||
      query.maxPrice != null,
  )
}

export function buildShopProductsWhere(query: ShopProductsQuery): Where | undefined {
  if (!shopProductsHasFilters(query)) return undefined

  return buildPublishedProductWhere({
    brandId: query.brandId,
    categoryId: query.categoryId,
    inStockOnly: query.inStockOnly,
    maxPrice: query.maxPrice,
    minPrice: query.minPrice,
    searchValue: query.searchValue,
    subcategoryId: query.subcategoryId,
  })
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
  const where = buildShopProductsWhere(resolvedQuery)

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
