import type { Product, TopSellingProductsBlock as TopSellingProductsBlockProps } from '@/payload-types'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import type { DefaultDocumentIDType } from 'payload'
import React from 'react'

import { TopSellingProductsClient } from './Component.client'

export const TopSellingProductsBlock: React.FC<
  TopSellingProductsBlockProps & {
    id?: DefaultDocumentIDType
  }
> = async (props) => {
  const heading = props.heading?.trim() || 'Top Selling Products'
  const selection = props.products

  if (!selection?.length) return null

  const idsOrdered = selection.map((item) =>
    typeof item === 'object' && item?.id !== undefined ? item.id : (item as number),
  )

  const payload = await getPayload({ config: configPromise })
  const { docs } = await payload.find({
    collection: 'products',
    depth: 2,
    draft: false,
    limit: idsOrdered.length,
    pagination: false,
    where: {
      and: [
        {
          id: {
            in: idsOrdered,
          },
        },
        {
          _status: {
            equals: 'published',
          },
        },
      ],
    },
  })

  const byId = new Map<number, Product>(docs.map((doc) => [doc.id as number, doc]))

  const ordered = idsOrdered.flatMap((id) => {
    const doc = byId.get(Number(id))
    return doc ? [doc] : []
  })

  if (!ordered.length) return null

  return <TopSellingProductsClient heading={heading} products={ordered} />
}
