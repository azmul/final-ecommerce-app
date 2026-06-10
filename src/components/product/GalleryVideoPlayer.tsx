'use client'

import dynamic from 'next/dynamic'
import { useMemo } from 'react'

import { galleryVideoThumbnailUrl } from '@/utilities/galleryMedia'
import { cn } from '@/utilities/cn'

const ReactPlayer = dynamic(() => import('react-player'), { ssr: false })

type GalleryVideoPlayerProps = {
  className?: string
  onPlayRequest?: () => void
  playing: boolean
  title?: string
  url: string
}

/** Universal gallery player (YouTube, Vimeo, Twitch, MP4, HLS, etc.) via react-player. */
export function GalleryVideoPlayer({
  className,
  onPlayRequest,
  playing,
  title = 'Product video',
  url,
}: GalleryVideoPlayerProps) {
  const light = useMemo(() => galleryVideoThumbnailUrl(url) ?? true, [url])

  return (
    <div
      className={cn(
        'absolute inset-0 overflow-hidden',
        '[&_.react-player]:!h-full [&_.react-player]:!w-full',
        '[&_iframe]:h-full [&_iframe]:w-full',
        '[&_video]:h-full [&_video]:w-full [&_video]:object-contain',
        className,
      )}
    >
      <ReactPlayer
        controls={playing}
        height="100%"
        light={playing ? false : light}
        onClickPreview={onPlayRequest}
        playsInline
        playing={playing}
        previewAriaLabel={`Play ${title}`}
        src={url}
        width="100%"
      />
    </div>
  )
}
