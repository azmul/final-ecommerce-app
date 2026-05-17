import type {
  Category,
  CategoryProductShowcaseBlock as CategoryProductShowcaseBlockProps,
} from '@/payload-types'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import type { DefaultDocumentIDType } from 'payload'
import React from 'react'

import { CategoryProductShowcaseClient } from './Component.client'
import {
  fetchCategoryProducts,
  FOR_YOU_CATEGORY_ID,
  type CategoryProductShowcaseSort,
} from './fetchProducts'
import type { CategoryTab } from './types'

export const CategoryProductShowcaseBlock: React.FC<
  CategoryProductShowcaseBlockProps & {
    id?: DefaultDocumentIDType
  }
> = async (props) => {
  const selection = props.categories
  if (!selection?.length) return null

  const idsOrdered = selection.map((c) =>
    typeof c === 'object' && c?.id !== undefined ? String(c.id) : String(c),
  )

  const payload = await getPayload({ config: configPromise })
  const { docs } = await payload.find({
    collection: 'categories',
    depth: 0,
    limit: idsOrdered.length,
    pagination: false,
    select: {
      title: true,
    },
    where: {
      id: {
        in: idsOrdered,
      },
    },
  })

  const byId = new Map(docs.map((doc) => [String(doc.id), doc as Category]))

  const categoryTabs: CategoryTab[] = []
  for (const id of idsOrdered) {
    const doc = byId.get(id)
    if (doc && typeof doc.title === 'string') {
      categoryTabs.push({ id, title: doc.title })
    }
  }

  if (!categoryTabs.length) return null

  const showForYou = props.showForYouTab !== false
  const forYouLabel = props.forYouLabel?.trim() || 'For You'
  const productsPerPage =
    typeof props.productsPerPage === 'number' && props.productsPerPage >= 6
      ? Math.min(props.productsPerPage, 48)
      : 18
  const sort = (props.sortBy as CategoryProductShowcaseSort | undefined) ?? '-updatedAt'
  const categoryIds = categoryTabs.map((tab) => tab.id)

  const tabs: CategoryTab[] = showForYou
    ? [{ id: FOR_YOU_CATEGORY_ID, title: forYouLabel }, ...categoryTabs]
    : categoryTabs

  const initialCategoryId = tabs[0].id

  const initial = await fetchCategoryProducts({
    categoryId: initialCategoryId,
    categoryIds,
    limit: productsPerPage,
    page: 1,
    sort,
  })

  const heading = props.heading?.trim()
  const headingId = 'category-product-showcase-heading'

  return (
    <CategoryProductShowcaseClient
      categoryIds={categoryIds}
      heading={heading}
      headingId={headingId}
      initialCategoryId={initialCategoryId}
      initialHasMore={initial.hasNextPage}
      initialProducts={initial.docs}
      productsPerPage={productsPerPage}
      sort={sort}
      tabs={tabs}
    />
  )
}
