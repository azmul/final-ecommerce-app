import type { Payload, Where } from 'payload'

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

export type ShopPriceBounds = {
  max: number
  min: number
}

export type ShopFilterFacets = {
  badges: ShopBadgeFacet[]
  brands: ShopBrandFacet[]
  priceBounds: ShopPriceBounds
}

function buildFacetBaseWhere(context: {
  categoryId?: string
  subcategoryId?: string
}): Where {
  const and: Where[] = [{ _status: { equals: 'published' } }]

  if (context.categoryId) {
    and.push({
      categories: {
        contains: context.categoryId,
      },
    })
  }

  if (context.subcategoryId) {
    and.push({
      subcategories: {
        contains: context.subcategoryId,
      },
    })
  }

  return { and }
}

export async function fetchShopFilterFacets(
  payload: Payload,
  context: { categoryId?: string; subcategoryId?: string },
): Promise<ShopFilterFacets> {
  const products = await payload.find({
    collection: 'products',
    depth: 0,
    limit: 5000,
    overrideAccess: false,
    pagination: false,
    select: {
      brand: true,
      priceInBDT: true,
      productBadge: true,
    },
    where: buildFacetBaseWhere(context),
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

  const priceBounds: ShopPriceBounds =
    minPrice === Number.POSITIVE_INFINITY || maxPrice === 0 ?
      { min: 0, max: 1000 }
    : minPrice === maxPrice ?
      { min: Math.max(0, Math.floor(minPrice) - 1), max: Math.ceil(maxPrice) + 1 }
    : { min: Math.floor(minPrice), max: Math.ceil(maxPrice) }

  return { badges, brands, priceBounds }
}
