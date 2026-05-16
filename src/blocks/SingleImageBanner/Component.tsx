import type { Media, SingleImageBannerBlock as SingleImageBannerBlockProps } from '@/payload-types'

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

const bannerClassName = cn(
  'relative block w-full overflow-hidden rounded-2xl border border-border/70 shadow-md outline-none',
  'aspect-[5/3] sm:aspect-[5/2] lg:aspect-[4/1]',
)

function BannerImage({ media }: { media: Media }) {
  return (
    <MediaCmp
      className="absolute inset-0 size-full"
      fill
      imgClassName="object-cover"
      priority
      resource={media}
    />
  )
}

export const SingleImageBannerBlock: React.FC<SingleImageBannerBlockProps> = async (props) => {
  const media = await resolveMedia(props.image)
  if (!media) return null

  const href = props.link?.trim()
  const label =
    typeof media.alt === 'string' && media.alt.trim() ? media.alt.trim() : 'Promotional banner'

  return (
    <section aria-label={label} className={cn(cmsBlockShellClassName, 'py-4 sm:py-6')}>
      {href ? (
        <Link
          aria-label={label}
          className={cn(
            bannerClassName,
            'ring-offset-2 transition hover:opacity-[0.98] focus-visible:ring-2 focus-visible:ring-ring',
          )}
          href={href}
        >
          <BannerImage media={media} />
        </Link>
      ) : (
        <BannerFigure className={bannerClassName} label={label} media={media} />
      )}
    </section>
  )
}

function BannerFigure({
  className,
  label,
  media,
}: {
  className: string
  label: string
  media: Media
}) {
  return (
    <figure aria-label={label} className={className}>
      <BannerImage media={media} />
    </figure>
  )
}
