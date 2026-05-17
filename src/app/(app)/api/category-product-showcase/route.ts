import {
  fetchCategoryProducts,
  FOR_YOU_CATEGORY_ID,
  type CategoryProductShowcaseSort,
} from '@/blocks/CategoryProductShowcase/fetchProducts'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const SORT_VALUES = new Set<CategoryProductShowcaseSort>(['-updatedAt', '-createdAt', 'title'])

function parsePositiveInt(raw: string | null, fallback: number, max: number): number {
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 1) return fallback
  return Math.min(Math.floor(n), max)
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const categoryId = url.searchParams.get('categoryId')?.trim()
  const categoryIdsRaw = url.searchParams.get('categoryIds')?.trim() ?? ''
  const page = parsePositiveInt(url.searchParams.get('page'), 1, 500)
  const limit = parsePositiveInt(url.searchParams.get('limit'), 18, 48)
  const sortRaw = url.searchParams.get('sort')?.trim() ?? '-updatedAt'
  const sort = SORT_VALUES.has(sortRaw as CategoryProductShowcaseSort)
    ? (sortRaw as CategoryProductShowcaseSort)
    : '-updatedAt'

  if (!categoryId) {
    return NextResponse.json({ error: 'categoryId is required' }, { status: 400 })
  }

  const categoryIds = categoryIdsRaw
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)

  if (categoryId !== FOR_YOU_CATEGORY_ID && !categoryIds.includes(categoryId)) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
  }

  try {
    const result = await fetchCategoryProducts({
      categoryId: categoryId === FOR_YOU_CATEGORY_ID ? FOR_YOU_CATEGORY_ID : categoryId,
      categoryIds,
      limit,
      page,
      sort,
    })

    return NextResponse.json({
      docs: result.docs,
      hasNextPage: result.hasNextPage,
      page: result.page,
      totalDocs: result.totalDocs,
    })
  } catch (error) {
    console.error('[category-product-showcase]', error)
    return NextResponse.json({ error: 'Failed to load products' }, { status: 500 })
  }
}
