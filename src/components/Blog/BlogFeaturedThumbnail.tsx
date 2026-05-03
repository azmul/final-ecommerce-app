import type { Media } from '@/payload-types'

import { Media as MediaCmp } from '@/components/Media'
import { parseYoutubeVideoId, youtubeThumbnailSrc } from '@/utilities/youtube'
import { cn } from '@/utilities/cn'
import Image from 'next/image'
import { Play } from 'lucide-react'

type Props = {
  /** Used for thumbnails / accessible labels */
  ariaLabelTitle: string
  className?: string
  featuredImage?: Media | null
  featuredYoutubeUrl?: string | null
  imgClassName?: string
  /** When true (default), overlays a subtle play icon for YouTube rows */
  /** Pass true for detail hero above the fold */
  priority?: boolean
  showYoutubePlayOverlay?: boolean
  sizes: string
}

export function BlogFeaturedThumbnail(props: Props) {
  const {
    ariaLabelTitle,
    className,
    featuredImage,
    featuredYoutubeUrl,
    imgClassName,
    priority = false,
    showYoutubePlayOverlay = true,
    sizes,
  } = props

  const videoId = parseYoutubeVideoId(featuredYoutubeUrl)

  const imageMedia =
    typeof featuredImage === 'object' && featuredImage !== null ? featuredImage : null

  if (videoId) {
    const src = youtubeThumbnailSrc(videoId)
    return (
      <div className={cn('relative h-full w-full overflow-hidden', className)}>
        <Image
          alt={`Featured video thumbnail — ${ariaLabelTitle}`}
          className={cn(
            'object-cover transition-transform duration-500 group-hover:scale-[1.02]',
            imgClassName,
          )}
          fill
          priority={priority}
          sizes={sizes}
          src={src}
        />
        {showYoutubePlayOverlay ?
          <>
            <div
              className="pointer-events-none absolute inset-0 bg-black/35 transition-opacity duration-300 group-hover:bg-black/25"
              aria-hidden
            />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden>
              <span
                className="flex size-12 items-center justify-center rounded-full border border-white/60 bg-black/55 text-white shadow-lg backdrop-blur-[2px]"
              >
                <Play className="ml-0.5 size-5 fill-current" aria-hidden />
              </span>
            </div>
          </>
        : null}
      </div>
    )
  }

  if (!imageMedia) return null

  return (
    <div className={cn('relative h-full w-full', className)}>
      <MediaCmp
        className="relative h-full w-full"
        fill
        imgClassName={cn(
          'object-cover transition-transform duration-500 group-hover:scale-[1.02]',
          imgClassName,
        )}
        resource={imageMedia}
        size={sizes}
      />
    </div>
  )
}
