import { describe, expect, it } from 'vitest'

import { buildPublishedProductWhere } from '@/lib/search/productSearch'
import {
  parseOptionalPrice,
  parseShopSearchParams,
  shopHasUserFilters,
  shopUrlHasFilterParams,
} from '@/lib/search/parseShopSearchParams'
import { buildShopListingKey } from '@/lib/search/shopProducts'
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
})
