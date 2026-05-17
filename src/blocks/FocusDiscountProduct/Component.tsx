import type { FocusDiscountProductBlock as FocusDiscountProductBlockProps, Media } from '@/payload-types'

import React from 'react'

import {
  FocusDiscountProductClient,
  type FocusDiscountProductItem,
} from './Component.client'

export const FocusDiscountProductBlock: React.FC<FocusDiscountProductBlockProps> = (props) => {
  const heading = props.heading?.trim() ?? ''
  const headingId = 'focus-discount-product-heading'

  const items: FocusDiscountProductItem[] = (props.items ?? []).flatMap((row) => {
    if (
      row?.categoryLabel?.trim() &&
      typeof row.discountPercentage === 'number' &&
      row.image &&
      typeof row.image === 'object' &&
      row.image !== null &&
      (row.image.url || row.image.filename)
    ) {
      return [
        {
          categoryLabel: row.categoryLabel.trim(),
          discountPercentage: Math.min(Math.max(row.discountPercentage, 0), 100),
          image: row.image as Media,
          linkUrl: row.linkUrl,
        },
      ]
    }
    return []
  })

  if (!items.length) return null

  return (
    <FocusDiscountProductClient heading={heading} headingId={headingId} items={items} />
  )
}
