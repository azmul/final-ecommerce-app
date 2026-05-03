import type { Media, PromoCarouselSplitBlock as PromoCarouselSplitBlockProps } from '@/payload-types'

import { cmsBlockShellClassName } from '@/utilities/cmsLayout'
import { cn } from '@/utilities/cn'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

import { PromoCarouselSplitClient, type PromoCarouselSplitSlide } from './Component.client'

async function resolveMedia(
  value: number | Media | null | undefined,
): Promise<Media | null> {
  if (value == null) return null
  if (typeof value === 'object') return value

  const payload = await getPayload({ config: configPromise })
  try {
    const doc = await payload.findByID({
      collection: 'media',
      depth: 0,
      id: value,
    })
    return doc as Media
  } catch {
    return null
  }
}

export const PromoCarouselSplitBlock: React.FC<PromoCarouselSplitBlockProps> = async (props) => {
  const { slides: slideRows, rightImage, rightLink } = props

  if (!slideRows?.length) return null

  const resolvedSlides: PromoCarouselSplitSlide[] = []
  for (const row of slideRows) {
    const media = await resolveMedia(row.image)
    const href = row.link?.trim() || '#'
    if (media) resolvedSlides.push({ href, media })
  }

  const rightMedia = await resolveMedia(rightImage)
  if (!resolvedSlides.length || !rightMedia) return null

  const rightHref = rightLink?.trim() || '#'

  return (
    <section className={cn(cmsBlockShellClassName, 'py-4 sm:py-6')}>
      <PromoCarouselSplitClient
        right={{ href: rightHref, media: rightMedia }}
        slides={resolvedSlides}
      />
    </section>
  )
}
