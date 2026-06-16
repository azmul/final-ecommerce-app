import {
  fetchShopProducts,
  SHOP_PRODUCTS_PER_PAGE,
  type ShopProductsQuery,
} from '@/lib/search/shopProducts'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function parsePositiveInt(raw: string | null, fallback: number, max: number): number {
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 1) return fallback
  return Math.min(Math.floor(n), max)
}

function optionalId(raw: string | null): string | undefined {
  const trimmed = raw?.trim()
  return trimmed || undefined
}

function optionalPrice(raw: string | null): number | undefined {
  if (!raw) return undefined
  const n = Number(raw)
  return Number.isFinite(n) ? n : undefined
}

function parseQuery(url: URL): ShopProductsQuery {
  const categorySlug = url.searchParams.get('categorySlug')?.trim() || undefined

  return {
    badge: url.searchParams.get('badge')?.trim() || undefined,
    brandId: optionalId(url.searchParams.get('brandId')),
    categoryId: optionalId(url.searchParams.get('categoryId')),
    categorySlug,
    inStockOnly: url.searchParams.get('inStock') === '1',
    maxPrice: optionalPrice(url.searchParams.get('maxPrice')),
    minPrice: optionalPrice(url.searchParams.get('minPrice')),
    page: parsePositiveInt(url.searchParams.get('page'), 1, 500),
    limit: parsePositiveInt(url.searchParams.get('limit'), SHOP_PRODUCTS_PER_PAGE, 48),
    searchValue: url.searchParams.get('q')?.trim() || undefined,
    sort: url.searchParams.get('sort')?.trim() || undefined,
    subcategoryId: optionalId(url.searchParams.get('subcategoryId')),
  }
}

export async function GET(req: Request) {
  const query = parseQuery(new URL(req.url))

  try {
    const payload = await getPayload({ config: configPromise })
    const result = await fetchShopProducts(payload, query)

    return NextResponse.json({
      docs: result.docs,
      hasNextPage: result.hasNextPage,
      page: result.page,
      totalDocs: result.totalDocs,
    })
  } catch (error) {
    console.error('[shop-products]', error)
    return NextResponse.json({ error: 'Failed to load products' }, { status: 500 })
  }
}
