import {
  cmsBlockShellClassName,
  cmsBlockSurfaceClassName,
} from '@/utilities/cmsLayout'
import { toKebabCase } from '@/utilities/toKebabCase'
import { cn } from '@/utilities/cn'
import React from 'react'

import { Reveal } from '@/components/motion/Reveal'
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

  const shellClassName = cn(
    cmsBlockShellClassName,
    !noBlockSurface && cmsBlockSurfaceClassName,
    !noBlockSurface && 'p-6 sm:p-8',
  )

  const content = (
    <>
      {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
      {/* @ts-ignore - block props vary by blockType */}
      <Block id={toKebabCase(blockName!)} {...block} />
    </>
  )

  // The first block is above the fold (likely the LCP element) — render it
  // statically so nothing delays its paint. Later blocks reveal on scroll.
  if (index === 0) {
    return <div className={shellClassName}>{content}</div>
  }

  return <Reveal className={shellClassName}>{content}</Reveal>
}
