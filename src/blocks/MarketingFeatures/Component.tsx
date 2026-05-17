import type { MarketingFeaturesBlock as MarketingFeaturesBlockProps } from '@/payload-types'

import { cmsBlockShellClassName } from '@/utilities/cmsLayout'
import { cn } from '@/utilities/cn'
import React from 'react'

import { MarketingFeaturesClient, type MarketingFeatureItem } from './Component.client'

export const MarketingFeaturesBlock: React.FC<MarketingFeaturesBlockProps> = (props) => {
  const items: MarketingFeatureItem[] = (props.items ?? []).flatMap((item) => {
    if (!item?.title?.trim() || !item.description?.trim() || !item.icon) return []
    return [
      {
        icon: item.icon,
        title: item.title.trim(),
        description: item.description.trim(),
        linkUrl: item.linkUrl,
        linkLabel: item.linkLabel,
      },
    ]
  })

  if (!items.length) return null

  return (
    <section className={cn(cmsBlockShellClassName, 'py-2 sm:py-4')}>
      <MarketingFeaturesClient
        columns={props.columns}
        heading={props.heading}
        items={items}
        subheading={props.subheading}
      />
    </section>
  )
}
