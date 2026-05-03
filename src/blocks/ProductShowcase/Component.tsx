import type { Product, ProductShowcaseBlock as ProductShowcaseBlockProps } from '@/payload-types'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

import { ProductShowcaseClient } from './Component.client'

export const ProductShowcaseBlock: React.FC<ProductShowcaseBlockProps> = async (props) => {
  const heading = props.heading?.trim() || 'Featured products'
  const viewAllUrl = props.viewAllUrl?.trim() || ''
  const selection = props.products

  if (!selection?.length) return null

  const idsOrdered = selection.map((item) =>
    typeof item === 'object' && item?.id !== undefined ? item.id : (item as number),
  )

  const payload = await getPayload({ config: configPromise })
  const { docs } = await payload.find({
    collection: 'products',
    depth: 2,
    limit: idsOrdered.length,
    pagination: false,
    where: {
      id: {
        in: idsOrdered,
      },
    },
  })

  const byId = new Map<number, Product>(docs.map((doc) => [doc.id as number, doc]))

  const ordered = idsOrdered.flatMap((id) => {
    const doc = byId.get(Number(id))
    return doc ? [doc] : []
  })

  if (!ordered.length) return null

  const headingId = props.id ? `product-showcase-${props.id}-heading` : 'product-showcase-heading'

  return (
    <ProductShowcaseClient
      heading={heading}
      headingId={headingId}
      products={ordered}
      viewAllUrl={viewAllUrl}
    />
  )
}
