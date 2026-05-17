import { buildPublishedProductWhere } from '@/lib/search/productSearch'
import configPromise from '@payload-config'
import type { Product } from '@/payload-types'
import { getPayload } from 'payload'

export const FOR_YOU_CATEGORY_ID = '__for_you__'

export type CategoryProductShowcaseSort = '-updatedAt' | '-createdAt' | 'title'

export type FetchCategoryProductsArgs = {
  categoryId: string | typeof FOR_YOU_CATEGORY_ID
  categoryIds: string[]
  limit: number
  page: number
  sort?: CategoryProductShowcaseSort
}

export type FetchCategoryProductsResult = {
  docs: Partial<Product>[]
  hasNextPage: boolean
  page: number
  totalDocs: number
}

const productSelect = {
  title: true,
  slug: true,
  gallery: true,
  priceInBDT: true,
  discountPercentage: true,
  enableVariants: true,
  inventory: true,
  productBadge: true,
} as const

export async function fetchCategoryProducts({
  categoryId,
  categoryIds,
  limit,
  page,
  sort = '-updatedAt',
}: FetchCategoryProductsArgs): Promise<FetchCategoryProductsResult> {
  const payload = await getPayload({ config: configPromise })

  const isForYou = categoryId === FOR_YOU_CATEGORY_ID
  const baseWhere = buildPublishedProductWhere({})
  const and = Array.isArray(baseWhere.and) ? [...baseWhere.and] : []

  if (isForYou && categoryIds.length > 0) {
    and.push({
      or: categoryIds.map((id) => ({
        categories: {
          contains: id,
        },
      })),
    })
  } else if (!isForYou) {
    and.push({
      categories: {
        contains: categoryId,
      },
    })
  }

  const where = { and }

  const result = await payload.find({
    collection: 'products',
    depth: 1,
    draft: false,
    limit,
    overrideAccess: false,
    page,
    select: productSelect,
    sort,
    where,
  })

  return {
    docs: result.docs as Partial<Product>[],
    hasNextPage: result.hasNextPage,
    page: result.page ?? page,
    totalDocs: result.totalDocs,
  }
}
