import type { Payload, Where } from 'payload'

import { fetchVariantOptionFacets } from '@/lib/search/variantOptionFacets'

export type ShopBrandFacet = {
  count: number
  id: number
  slug: string
  title: string
}

export type ShopBadgeFacet = {
  count: number
  label: string
}

export type ShopCategoryFacet = {
  count: number
  id: number
  slug: string
  title: string
}

export type ShopSubcategoryFacet = {
  count: number
  id: number
  slug: string
  title: string
}

export type ShopPriceBounds = {
  max: number
  min: number
}

export type ShopFilterFacets = {
  badges: ShopBadgeFacet[]
  brands: ShopBrandFacet[]
  categories: ShopCategoryFacet[]
  priceBounds: ShopPriceBounds
  subcategories: ShopSubcategoryFacet[]
  variantOptions: import('@/lib/search/variantOptionFacets').ShopVariantOptionFacet[]
}

function buildFacetProductWhere(categoryId?: string): Where {
  const and: Where[] = [{ _status: { equals: 'published' } }]

  if (categoryId) {
    and.push({
      categories: {
        contains: categoryId,
      },
    })
  }

  return { and }
}

export function countRelationshipIds(
  docs: Array<{ categories?: unknown; subcategories?: unknown }>,
  field: 'categories' | 'subcategories',
): Map<number, number> {
  const counts = new Map<number, number>()

  for (const doc of docs) {
    const values = doc[field]
    if (!Array.isArray(values)) continue

    for (const value of values) {
      const id = typeof value === 'number' ? value : typeof value === 'object' && value && 'id' in value ? (value as { id: number }).id : null
      if (typeof id === 'number') {
        counts.set(id, (counts.get(id) ?? 0) + 1)
      }
    }
  }

  return counts
}

export async function fetchShopFilterFacets(
  payload: Payload,
  context: { categoryId?: string },
): Promise<ShopFilterFacets> {
  const products = await payload.find({
    collection: 'products',
    depth: 0,
    limit: 5000,
    overrideAccess: false,
    pagination: false,
    select: {
      brand: true,
      categories: true,
      priceInBDT: true,
      productBadge: true,
      subcategories: true,
    },
    where: buildFacetProductWhere(context.categoryId),
  })

  const brandCounts = new Map<number, number>()
  const badgeCounts = new Map<string, number>()
  let minPrice = Number.POSITIVE_INFINITY
  let maxPrice = 0

  for (const doc of products.docs) {
    const price = typeof doc.priceInBDT === 'number' ? doc.priceInBDT : null
    if (price != null && Number.isFinite(price)) {
      minPrice = Math.min(minPrice, price)
      maxPrice = Math.max(maxPrice, price)
    }

    const brandId = doc.brand
    if (typeof brandId === 'number') {
      brandCounts.set(brandId, (brandCounts.get(brandId) ?? 0) + 1)
    }

    const badge =
      typeof doc.productBadge === 'string' ? doc.productBadge.trim() : ''
    if (badge) {
      badgeCounts.set(badge, (badgeCounts.get(badge) ?? 0) + 1)
    }
  }

  const brandIds = [...brandCounts.keys()]
  const brandMeta = new Map<number, { slug: string; title: string }>()

  if (brandIds.length > 0) {
    const brands = await payload.find({
      collection: 'brands',
      depth: 0,
      limit: brandIds.length,
      overrideAccess: false,
      pagination: false,
      select: { slug: true, title: true },
      where: {
        id: {
          in: brandIds,
        },
      },
    })

    for (const brand of brands.docs) {
      if (typeof brand.slug === 'string' && brand.slug) {
        brandMeta.set(brand.id, {
          slug: brand.slug,
          title: typeof brand.title === 'string' ? brand.title : brand.slug,
        })
      }
    }
  }

  const brands: ShopBrandFacet[] = [...brandCounts.entries()]
    .map(([id, count]) => {
      const meta = brandMeta.get(id)
      if (!meta) return null
      return { count, id, slug: meta.slug, title: meta.title }
    })
    .filter((item): item is ShopBrandFacet => item != null)
    .sort((a, b) => a.title.localeCompare(b.title))

  const badges: ShopBadgeFacet[] = [...badgeCounts.entries()]
    .map(([label, count]) => ({ count, label }))
    .sort((a, b) => a.label.localeCompare(b.label))

  let categories: ShopCategoryFacet[] = []
  let subcategories: ShopSubcategoryFacet[] = []

  if (context.categoryId) {
    const subcategoryCounts = countRelationshipIds(products.docs, 'subcategories')
    const subsResponse = await payload.find({
      collection: 'subcategories',
      depth: 0,
      limit: 500,
      overrideAccess: false,
      pagination: false,
      select: { slug: true, title: true },
      sort: 'title',
      where: {
        parent: {
          equals: context.categoryId,
        },
      },
    })

    subcategories = subsResponse.docs
      .filter((doc) => typeof doc.slug === 'string' && doc.slug)
      .map((doc) => ({
        count: subcategoryCounts.get(doc.id) ?? 0,
        id: doc.id,
        slug: doc.slug as string,
        title: typeof doc.title === 'string' ? doc.title : (doc.slug as string),
      }))
  } else {
    const categoryCounts = countRelationshipIds(products.docs, 'categories')
    const categoriesResponse = await payload.find({
      collection: 'categories',
      depth: 0,
      limit: 500,
      overrideAccess: false,
      pagination: false,
      select: { slug: true, title: true },
      sort: 'title',
    })

    categories = categoriesResponse.docs
      .filter((doc) => typeof doc.slug === 'string' && doc.slug)
      .map((doc) => ({
        count: categoryCounts.get(doc.id) ?? 0,
        id: doc.id,
        slug: doc.slug as string,
        title: typeof doc.title === 'string' ? doc.title : (doc.slug as string),
      }))
      .filter((item) => item.count > 0)
  }

  const priceBounds: ShopPriceBounds =
    minPrice === Number.POSITIVE_INFINITY || maxPrice === 0 ?
      { min: 0, max: 1000 }
    : minPrice === maxPrice ?
      { min: Math.max(0, Math.floor(minPrice) - 1), max: Math.ceil(maxPrice) + 1 }
    : { min: Math.floor(minPrice), max: Math.ceil(maxPrice) }

  const variantOptions = await fetchVariantOptionFacets(payload, context)

  return { badges, brands, categories, priceBounds, subcategories, variantOptions }
}
