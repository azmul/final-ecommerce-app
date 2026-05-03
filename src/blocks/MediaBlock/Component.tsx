import type { StaticImageData } from 'next/image'

import type { MediaBlock as MediaBlockProps } from '@/payload-types'
import { Media } from '@/components/Media'
import { RichText } from '@/components/RichText'
import { cmsBlockShellClassName } from '@/utilities/cmsLayout'
import { cn } from '@/utilities/cn'
import React from 'react'

export const MediaBlock: React.FC<
  MediaBlockProps & {
    id?: string | number
    breakout?: boolean
    captionClassName?: string
    className?: string
    enableGutter?: boolean
    imgClassName?: string
    staticImage?: StaticImageData
    disableInnerContainer?: boolean
  }
> = (props) => {
  const {
    captionClassName,
    className,
    imgClassName,
    media,
    staticImage,
    disableInnerContainer,
  } = props

  let caption
  if (media && typeof media === 'object') caption = media.caption

  return (
    <div className={cn(cmsBlockShellClassName, className)}>
      <Media
        imgClassName={cn('border border-border rounded-[0.8rem]', imgClassName)}
        resource={media}
        src={staticImage}
      />
      {caption && (
        <div
          className={cn(
            'mt-6',
            !disableInnerContainer && cmsBlockShellClassName,
            captionClassName,
          )}
        >
          <RichText data={caption} enableGutter={false} />
        </div>
      )}
    </div>
  )
}
