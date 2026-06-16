import { describe, expect, it } from 'vitest'

import { buildPublishedProductWhere } from '@/lib/search/productSearch'
import {
  parseOptionalPrice,
  parseShopSearchParams,
  shopHasUserFilters,
  shopUrlHasFilterParams,
} from '@/lib/search/parseShopSearchParams'
import { buildShopListingKey } from '@/lib/search/shopProducts'
import { countRelationshipIds } from '@/lib/search/shopFilterFacets'
import { shopGridClassName } from '@/lib/search/shopGridView'

describe('parseShopSearchParams', () => {
  it('parses shop filter query params', () => {
    expect(
      parseShopSearchParams({
        badge: 'New Arrival',
        brand: 'shosti-food',
        inStock: '1',
        maxPrice: '580',
        minPrice: '250',
        q: 'pickle',
        sort: '-priceInBDT',
        sub: 'garlic',
        view: 'compact',
      }),
    ).toEqual({
      badge: 'New Arrival',
      brandSlug: 'shosti-food',
      inStockOnly: true,
      maxPrice: 580,
      minPrice: 250,
      searchValue: 'pickle',
      sort: '-priceInBDT',
      subcategorySlug: 'garlic',
      variantOptionIds: [],
      view: 'compact',
    })
  })

  it('ignores invalid numeric and view params', () => {
    expect(parseShopSearchParams({ minPrice: 'abc', view: 'wide' }).minPrice).toBeUndefined()
    expect(parseShopSearchParams({ view: 'wide' }).view).toBeUndefined()
  })

  it('normalizes empty sort to undefined', () => {
    expect(parseShopSearchParams({ sort: '  ' }).sort).toBeUndefined()
  })
})

describe('parseOptionalPrice', () => {
  it('accepts zero and rejects invalid values', () => {
    expect(parseOptionalPrice('0')).toBe(0)
    expect(parseOptionalPrice('abc')).toBeUndefined()
    expect(parseOptionalPrice('-5')).toBeUndefined()
  })
})

describe('shopUrlHasFilterParams', () => {
  it('detects filter keys even when values are invalid', () => {
    expect(shopUrlHasFilterParams(new URLSearchParams('minPrice=abc'))).toBe(true)
    expect(shopUrlHasFilterParams(new URLSearchParams('view=compact'))).toBe(false)
  })
})

describe('shopHasUserFilters', () => {
  it('returns false for category-only context', () => {
    expect(shopHasUserFilters({})).toBe(false)
  })

  it('returns true when a valid user filter is present', () => {
    expect(shopHasUserFilters({ brandSlug: 'shosti-food' })).toBe(true)
    expect(shopHasUserFilters({ badge: 'New Arrival' })).toBe(true)
    expect(shopHasUserFilters({ minPrice: 100 })).toBe(true)
    expect(shopHasUserFilters({ sort: '-createdAt' })).toBe(true)
  })

  it('returns false for invalid-only price params', () => {
    expect(shopHasUserFilters({ minPrice: undefined, maxPrice: undefined })).toBe(false)
  })
})

describe('buildPublishedProductWhere', () => {
  it('includes brand, badge, and price filters', () => {
    const where = buildPublishedProductWhere({
      badge: 'New Arrival',
      brandId: '12',
      maxPrice: 580,
      minPrice: 250,
    })

    expect(where.and).toEqual(
      expect.arrayContaining([
        { _status: { equals: 'published' } },
        { brand: { equals: '12' } },
        { productBadge: { equals: 'New Arrival' } },
        { priceInBDT: { greater_than_equal: 250 } },
        { priceInBDT: { less_than_equal: 580 } },
      ]),
    )
  })

  it('includes subcategory and in-stock filters', () => {
    const where = buildPublishedProductWhere({
      inStockOnly: true,
      subcategoryId: '9',
    })

    expect(where.and).toEqual(
      expect.arrayContaining([
        { subcategories: { contains: '9' } },
        {
          or: [
            {
              and: [{ enableVariants: { equals: false } }, { inventory: { greater_than: 0 } }],
            },
            { enableVariants: { equals: true } },
          ],
        },
      ]),
    )
  })
})

describe('shopGridClassName', () => {
  it('returns distinct layouts per view', () => {
    expect(shopGridClassName('compact')).toContain('xl:grid-cols-5')
    expect(shopGridClassName('comfortable')).toContain('grid-cols-1')
    expect(shopGridClassName()).toContain('xl:grid-cols-4')
  })
})

describe('buildShopListingKey', () => {
  it('changes when product filters change but not for view-only changes', () => {
    const base = {
      categoryId: '1',
      categorySlug: 'pickle',
    }

    const withBrand = buildShopListingKey({ ...base, brandId: '2' })
    const withView = buildShopListingKey({ ...base, view: 'compact' })
    const baseKey = buildShopListingKey(base)

    expect(withBrand).not.toBe(baseKey)
    expect(withView).toBe(baseKey)
  })

  it('changes when subcategory filter changes', () => {
    const base = { categoryId: '1', categorySlug: 'pickle' }
    const withSub = buildShopListingKey({ ...base, subcategoryId: '9' })

    expect(withSub).not.toBe(buildShopListingKey(base))
  })
})

describe('countRelationshipIds', () => {
  it('counts populated and id-only relationship values', () => {
    const docs = [
      { categories: [{ id: 1 }, { id: 2 }] },
      { categories: 1 },
      { categories: [{ id: 1 }] },
      { subcategories: [{ id: 3 }] },
    ]

    expect(Object.fromEntries(countRelationshipIds(docs, 'categories'))).toEqual({
      '1': 2,
      '2': 1,
    })
    expect(Object.fromEntries(countRelationshipIds(docs, 'subcategories'))).toEqual({
      '3': 1,
    })
  })
})
