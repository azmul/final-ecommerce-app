import type { StaticImageData } from 'next/image'

import { cn } from '@/utilities/cn'
import { getServerSideURL, toAbsoluteUrl } from '@/utilities/getURL'
import NextImage from 'next/image'
import React from 'react'

import type { Props as MediaProps } from '../types'

import { cssVariables } from '@/cssVariables'
import { PRODUCT_CARD_IMAGE_SIZES } from '@/lib/seo/imageSizes'

const { breakpoints } = cssVariables

export const Image: React.FC<MediaProps> = (props) => {
  const {
    alt: altFromProps,
    fill,
    height: heightFromProps,
    imgClassName,
    onClick,
    onLoad: onLoadFromProps,
    priority,
    resource,
    size: sizeFromProps,
    src: srcFromProps,
    width: widthFromProps,
  } = props

  let width: number | undefined | null
  let height: number | undefined | null
  let alt = altFromProps
  let src: StaticImageData | string = srcFromProps || ''
  let filenameForAlt: string | undefined

  if (!src && resource && typeof resource === 'object') {
    const {
      alt: altFromResource,
      filename: fullFilename,
      height: fullHeight,
      url,
      width: fullWidth,
    } = resource

    width = widthFromProps ?? fullWidth
    height = heightFromProps ?? fullHeight
    alt = altFromResource
    filenameForAlt = typeof fullFilename === 'string' ? fullFilename : undefined

    src = toAbsoluteUrl(url) ?? `${getServerSideURL()}${url}`
  }

  const resolvedAlt = (alt && alt.trim()) || (filenameForAlt ? `Image: ${filenameForAlt}` : 'Image')

  const sizes = sizeFromProps
    ? sizeFromProps
    : fill
      ? PRODUCT_CARD_IMAGE_SIZES
      : Object.entries(breakpoints)
          .map(([, value]) => `(max-width: ${value}px) ${value}px`)
          .join(', ')

  return (
    <NextImage
      alt={resolvedAlt}
      className={cn(imgClassName)}
      decoding="async"
      fetchPriority={priority ? 'high' : undefined}
      fill={fill}
      height={!fill ? height || heightFromProps : undefined}
      onClick={onClick}
      onLoad={onLoadFromProps}
      priority={priority}
      quality={priority ? 90 : 80}
      sizes={sizes}
      src={src}
      width={!fill ? width || widthFromProps : undefined}
    />
  )
}
