import type { Brand, BrandsCarouselBlock as BrandsCarouselBlockProps } from '@/payload-types'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import type { DefaultDocumentIDType } from 'payload'
import React from 'react'

import { BrandsCarouselClient } from './Component.client'

export const BrandsCarouselBlock: React.FC<
  BrandsCarouselBlockProps & {
    id?: DefaultDocumentIDType
  }
> = async (props) => {
  const heading = props.heading?.trim() || 'Our Brands'
  const selection = props.brands

  if (!selection?.length) return null

  const idsOrdered = selection.map((b) =>
    typeof b === 'object' && b?.id !== undefined ? b.id : (b as number),
  )

  const payload = await getPayload({ config: configPromise })
  const { docs } = await payload.find({
    collection: 'brands',
    depth: 2,
    limit: idsOrdered.length,
    pagination: false,
    where: {
      id: {
        in: idsOrdered,
      },
    },
  })

  const byId = new Map(docs.map((doc) => [doc.id as number, doc as Brand]))

  const ordered: Brand[] = []
  for (const id of idsOrdered) {
    const doc = byId.get(Number(id))
    if (doc && typeof doc.slug === 'string' && doc.slug.trim().length > 0) {
      ordered.push(doc)
    }
  }

  if (!ordered.length) return null

  return <BrandsCarouselClient brands={ordered} heading={heading} />
}
