import type { Media, TwoImagePromoBlock as TwoImagePromoBlockProps } from '@/payload-types'

import { Media as MediaCmp } from '@/components/Media'
import { cmsBlockShellClassName } from '@/utilities/cmsLayout'
import { cn } from '@/utilities/cn'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import Link from 'next/link'
import React from 'react'

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

function PromoTile({ href, media }: { href: string; media: Media }) {
  const label =
    typeof media.alt === 'string' && media.alt.trim() ? media.alt.trim() : 'Promotional banner'

  return (
    <Link
      aria-label={label}
      className={cn(
        'group relative block aspect-5/3 w-full overflow-hidden rounded-2xl border border-border/70 shadow-md outline-none ring-offset-2 transition hover:opacity-[0.98] focus-visible:ring-2 focus-visible:ring-ring sm:aspect-2/1',
      )}
      href={href}
    >
      <MediaCmp
        className="absolute inset-0 size-full"
        fill
        imgClassName="object-cover transition duration-300 ease-out group-hover:scale-[1.02]"
        resource={media}
      />
    </Link>
  )
}

export const TwoImagePromoBlock: React.FC<TwoImagePromoBlockProps> = async (props) => {
  const [leftMedia, rightMedia] = await Promise.all([
    resolveMedia(props.leftImage),
    resolveMedia(props.rightImage),
  ])

  if (!leftMedia || !rightMedia) return null

  const leftHref = props.leftLink?.trim() || '#'
  const rightHref = props.rightLink?.trim() || '#'

  return (
    <section className={cn(cmsBlockShellClassName, 'py-4 sm:py-6')}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
        <PromoTile href={leftHref} media={leftMedia} />
        <PromoTile href={rightHref} media={rightMedia} />
      </div>
    </section>
  )
}
