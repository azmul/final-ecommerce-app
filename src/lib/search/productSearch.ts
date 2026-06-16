import { buildProductTextSearchWhere } from '@/lib/search/productRelevance'
import type { Payload, Where } from 'payload'

export type ShopProductFilters = {
  badge?: string
  brandId?: string
  categoryId?: string
  inStockOnly?: boolean
  maxPrice?: number
  minPrice?: number
  searchValue?: string
  subcategoryId?: string
  variantOptionIds?: number[]
}

export function buildPublishedProductWhere(filters: ShopProductFilters): Where {
  const and: Where[] = [
    {
      _status: {
        equals: 'published',
      },
    },
  ]

  const textSearch = buildProductTextSearchWhere(filters.searchValue ?? '')
  if (textSearch) {
    and.push(textSearch)
  }

  if (filters.categoryId) {
    and.push({
      categories: {
        contains: filters.categoryId,
      },
    })
  }

  if (filters.subcategoryId) {
    and.push({
      subcategories: {
        contains: filters.subcategoryId,
      },
    })
  }

  if (filters.brandId) {
    and.push({
      brand: {
        equals: filters.brandId,
      },
    })
  }

  if (filters.badge) {
    and.push({
      productBadge: {
        equals: filters.badge,
      },
    })
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

  if (typeof filters.minPrice === 'number' && Number.isFinite(filters.minPrice)) {
    and.push({
      priceInBDT: {
        greater_than_equal: filters.minPrice,
      },
    })
  }

  if (typeof filters.maxPrice === 'number' && Number.isFinite(filters.maxPrice)) {
    and.push({
      priceInBDT: {
        less_than_equal: filters.maxPrice,
      },
    })
  }

  return { and }
}
