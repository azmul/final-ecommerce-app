import {
  cmsBlockShellClassName,
  cmsBlockSurfaceClassName,
} from '@/utilities/cmsLayout'
import { toKebabCase } from '@/utilities/toKebabCase'
import { cn } from '@/utilities/cn'
import React from 'react'

import { loadBlockComponent, type LayoutBlock } from './blockLoaders'

const blockTypesWithoutSurface = new Set<string>([
  'testimonials',
  'twoImagePromo',
  'singleImageBanner',
  'promoCarouselSplit',
  'campaignHero',
  'countdownPromo',
  'marketingFeatures',
  'trustStats',
  'campaignBannerStrip',
  'focusDiscountProduct',
  'categoryProductShowcase',
  'faq',
])

type Props = {
  block: LayoutBlock
  index: number
}

export async function BlockRenderer({ block, index }: Props) {
  const { blockName, blockType } = block

  if (!blockType) return null

  const Block = await loadBlockComponent(blockType)
  if (!Block) return null

  const noBlockSurface = blockTypesWithoutSurface.has(blockType)

  return (
    <div
      className={cn(
        cmsBlockShellClassName,
        !noBlockSurface && cmsBlockSurfaceClassName,
        !noBlockSurface && 'p-6 sm:p-8',
      )}
      key={index}
    >
      {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
      {/* @ts-ignore - block props vary by blockType */}
      <Block id={toKebabCase(blockName!)} {...block} />
    </div>
  )
}
