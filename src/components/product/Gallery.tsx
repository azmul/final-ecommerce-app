import type { Product } from '@/payload-types'

import { GalleryClient } from '@/components/product/Gallery.client'
import { GalleryServer } from '@/components/product/GalleryServer'
import React from 'react'

type Props = {
  gallery: NonNullable<Product['gallery']>
  /** Edge-to-edge gallery on the smallest breakpoints (product hero). */
  mobileFullBleed?: boolean
  /** Optional product name used as alt-text fallback in the SSR baseline. */
  productName?: string
}

/**
 * Server-rendered orchestrator for the product gallery.
 *
 * - Emits a fully accessible <ul> of <Image> tags (via <GalleryServer />) in the
 *   initial HTML so AI crawlers and no-JS clients see every product image.
 * - Mounts the interactive lightbox/carousel UX (<GalleryClient />) on top.
 *   Once JS hydrates, the client island hides the SSR fallback (it carries
 *   `data-gallery-fallback`) and takes over visually.
 *
 * Public API matches the previous client-only Gallery so callers don't change.
 */
export const Gallery: React.FC<Props> = ({ gallery, mobileFullBleed = false, productName }) => {
  return (
    <>
      {/* SSR baseline: always present in initial HTML for crawlers / no-JS. */}
      <div data-gallery-fallback className="contents">
        <GalleryServer gallery={gallery} productName={productName} />
      </div>

      {/* Interactive enhancement: hides the fallback after mount. */}
      <GalleryClient gallery={gallery} mobileFullBleed={mobileFullBleed} />
    </>
  )
}

export default Gallery
