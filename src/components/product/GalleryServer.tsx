import type { Product } from '@/payload-types'

import { resolveGallerySlides } from '@/utilities/galleryMedia'
import { cn } from '@/utilities/cn'
import Image from 'next/image'
import React from 'react'

type Props = {
  gallery: NonNullable<Product['gallery']>
  productName?: string
  className?: string
}

/**
 * Server-rendered baseline gallery. Emits a plain <ul> of <Image> tags so that
 * AI crawlers and no-JS clients see every product image in the initial HTML.
 * The interactive carousel/lightbox UX lives in Gallery.client.tsx and hydrates
 * on top of this markup on the client.
 */
export const GalleryServer: React.FC<Props> = ({ gallery, productName, className }) => {
  const slides = resolveGallerySlides(gallery)
  const imageSlides = slides.filter(
    (slide): slide is Extract<typeof slide, { kind: 'image' }> => slide.kind === 'image',
  )

  if (!imageSlides.length) return null

  return (
    <section aria-label="Product images" className={cn('w-full', className)}>
      <ul
        role="list"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2"
      >
        {imageSlides.map((slide, i) => {
          const img = slide.image
          const src = img.url ?? ''
          if (!src) return null

          const fallbackAlt = productName
            ? `${productName} - image ${i + 1}`
            : `Product image ${i + 1}`
          const alt = img.alt?.trim() ? img.alt : fallbackAlt

          const width = img.width ?? 1200
          const height = img.height ?? 1200

          return (
            <li key={img.id ?? `gallery-image-${i}`} className="overflow-hidden rounded-xl border border-border/70 bg-white dark:bg-card">
              <Image
                src={src}
                alt={alt}
                width={width}
                height={height}
                priority={i === 0}
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="h-auto w-full object-contain"
              />
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export default GalleryServer
