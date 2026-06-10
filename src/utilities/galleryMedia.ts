import type { Media, Product } from '@/payload-types'

import { parseYoutubeVideoId } from '@/utilities/youtube'

export type GalleryImageSlide = {
  kind: 'image'
  image: Media
  index: number
}

export type GalleryVideoSlide = {
  kind: 'video'
  index: number
  videoUrl: string
}

export type GallerySlide = GalleryImageSlide | GalleryVideoSlide

export function normalizeGalleryVideoUrl(input: string | null | undefined): string | null {
  const raw = input?.trim()
  if (!raw) return null

  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    return url.toString()
  } catch {
    return null
  }
}

/** Accepts YouTube, Vimeo, Twitch, direct files, HLS, and other URLs react-player supports. */
export function isValidGalleryVideoUrl(input: string | null | undefined): boolean {
  return normalizeGalleryVideoUrl(input) !== null
}

export function galleryVideoThumbnailUrl(videoUrl: string): string | null {
  const youtubeId = parseYoutubeVideoId(videoUrl)
  if (youtubeId) return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
  return null
}

export function resolveGallerySlides(gallery: NonNullable<Product['gallery']>): GallerySlide[] {
  const slides: GallerySlide[] = []

  gallery.forEach((item, index) => {
    const mediaType = item.mediaType ?? 'image'

    if (mediaType === 'video') {
      const videoUrl = normalizeGalleryVideoUrl(item.videoUrl)
      if (videoUrl) slides.push({ kind: 'video', index, videoUrl })
      return
    }

    if (typeof item.image === 'object' && item.image) {
      slides.push({ kind: 'image', image: item.image as Media, index })
    }
  })

  return slides
}

export function galleryHasRenderableSlides(gallery: Product['gallery'] | null | undefined): boolean {
  if (!gallery?.length) return false
  return resolveGallerySlides(gallery).length > 0
}

export function gallerySlideKey(slide: GallerySlide): string {
  if (slide.kind === 'image') return `image-${slide.image.id}-${slide.index}`
  return `video-${slide.index}-${slide.videoUrl}`
}
