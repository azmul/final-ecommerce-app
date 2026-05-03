import type {
  Category,
  FeaturedCategoriesBlock as FeaturedCategoriesBlockProps,
} from '@/payload-types'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import type { DefaultDocumentIDType } from 'payload'
import React from 'react'

import { FeaturedCategoriesClient } from './Component.client'

export const FeaturedCategoriesBlock: React.FC<
  FeaturedCategoriesBlockProps & {
    id?: DefaultDocumentIDType
  }
> = async (props) => {
  const heading = props.heading?.trim() || 'Featured Categories'
  const selection = props.categories

  if (!selection?.length) return null

  const idsOrdered = selection.map((c) => (typeof c === 'object' && c?.id !== undefined ? c.id : (c as number)))

  const payload = await getPayload({ config: configPromise })
  const { docs } = await payload.find({
    collection: 'categories',
    depth: 2,
    limit: idsOrdered.length,
    pagination: false,
    where: {
      id: {
        in: idsOrdered,
      },
    },
  })

  const byId = new Map(docs.map((doc) => [doc.id as number, doc as Category]))

  const ordered: Category[] = []
  for (const id of idsOrdered) {
    const doc = byId.get(Number(id))
    if (doc) ordered.push(doc)
  }

  if (!ordered.length) return null

  return <FeaturedCategoriesClient categories={ordered} heading={heading} />
}
