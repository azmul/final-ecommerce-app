'use client'

import type { Product } from '@/payload-types'

import { GridTileImage } from '@/components/Grid/tile'
import { GalleryVideoPlayer } from '@/components/product/GalleryVideoPlayer'
import { Media } from '@/components/Media'
import { Button } from '@/components/ui/button'
import { Carousel, CarouselApi, CarouselContent, CarouselItem } from '@/components/ui/carousel'
import {
  type GallerySlide,
  gallerySlideKey,
  galleryVideoThumbnailUrl,
  resolveGallerySlides,
} from '@/utilities/galleryMedia'
import { cn } from '@/utilities/cn'
import { Check, ChevronLeft, ChevronRight, Play, X, ZoomIn } from 'lucide-react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { DefaultDocumentIDType } from 'payload'
import { queueStateUpdate } from '@/hooks/queueStateUpdate'
import React, { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

type Props = {
  gallery: NonNullable<Product['gallery']>
  /** Edge-to-edge gallery on the smallest breakpoints (product hero). */
  mobileFullBleed?: boolean
}

export const GalleryClient: React.FC<Props> = ({ gallery, mobileFullBleed = false }) => {
  const searchParams = useSearchParams()
  const slides = resolveGallerySlides(gallery)
  const [current, setCurrent] = useState(0)
  const [api, setApi] = useState<CarouselApi>()
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [playingVideoIndex, setPlayingVideoIndex] = useState<number | null>(null)
  const [portalReady, setPortalReady] = useState(false)

  useEffect(() => {
    queueStateUpdate(() => setPortalReady(true))
  }, [])

  // Once the interactive gallery hydrates, hide the SSR baseline fallback so
  // users don't see two galleries stacked. The fallback stays in the DOM for
  // crawlers and no-JS clients.
  useEffect(() => {
    if (typeof document === 'undefined') return
    const nodes = document.querySelectorAll<HTMLElement>('[data-gallery-fallback]')
    nodes.forEach((node) => {
      node.setAttribute('hidden', '')
      node.setAttribute('aria-hidden', 'true')
    })
    return () => {
      nodes.forEach((node) => {
        node.removeAttribute('hidden')
        node.removeAttribute('aria-hidden')
      })
    }
  }, [])

  const total = slides.length
  const activeSlide = slides[current]

  const goTo = useCallback(
    (index: number) => {
      if (total === 0) return
      const next = ((index % total) + total) % total
      setCurrent(next)
      api?.scrollTo(next, true)
    },
    [api, total],
  )

  const goPrev = useCallback(() => goTo(current - 1), [current, goTo])
  const goNext = useCallback(() => goTo(current + 1), [current, goTo])

  useEffect(() => {
    if (!api) return

    const onSelect = () => {
      setCurrent(api.selectedScrollSnap())
    }

    api.on('select', onSelect)
    return () => {
      api.off('select', onSelect)
    }
  }, [api])

  useEffect(() => {
    if (playingVideoIndex !== null && playingVideoIndex !== current) {
      setPlayingVideoIndex(null)
    }
  }, [current, playingVideoIndex])

  useEffect(() => {
    const values = Array.from(searchParams.values())

    if (!values.length || !api) return

    const index = gallery.findIndex((item) => {
      if (!item.variantOption) return false

      let variantID: DefaultDocumentIDType

      if (typeof item.variantOption === 'object') {
        variantID = item.variantOption.id
      } else {
        variantID = item.variantOption
      }

      return Boolean(values.find((value) => value === String(variantID)))
    })

    if (index !== -1) {
      const slideIndex = slides.findIndex((slide) => slide.index === index)
      if (slideIndex !== -1) {
        queueStateUpdate(() => goTo(slideIndex))
      }
    }
  }, [searchParams, api, gallery, goTo, slides])

  useEffect(() => {
    if (!lightboxOpen) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setLightboxOpen(false)
      if (event.key === 'ArrowLeft') goPrev()
      if (event.key === 'ArrowRight') goNext()
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [goNext, goPrev, lightboxOpen])

  if (!activeSlide) return null

  const lightboxImageSlide = activeSlide.kind === 'image' ? activeSlide : null

  const lightbox =
    lightboxOpen && portalReady && lightboxImageSlide ?
      createPortal(
        <div
          aria-label="Product image fullscreen view"
          aria-modal="true"
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/92 p-4 backdrop-blur-sm sm:p-8"
          role="dialog"
        >
          <button
            type="button"
            aria-label="Close fullscreen view"
            className="absolute inset-0 cursor-zoom-out"
            onClick={() => setLightboxOpen(false)}
          />
          <Button
            aria-label="Close"
            className="absolute right-3 top-3 z-20 size-10 rounded-full border-white/20 bg-black/55 text-white hover:bg-black/75 sm:right-5 sm:top-5"
            onClick={() => setLightboxOpen(false)}
            size="icon"
            type="button"
            variant="outline"
          >
            <X aria-hidden className="size-5" />
          </Button>
          <div
            className="relative z-10 flex h-full w-full max-w-5xl items-center justify-center"
            onClick={(event) => event.stopPropagation()}
          >
            <Media
              resource={lightboxImageSlide.image}
              className="relative max-h-full max-w-full"
              imgClassName="max-h-[85vh] w-auto max-w-full object-contain"
              priority
              size="100vw"
            />
            {total > 1 ?
              <>
                <Button
                  aria-label="Previous slide"
                  className="absolute left-0 top-1/2 size-11 -translate-y-1/2 rounded-full border-white/20 bg-black/50 text-white hover:bg-black/70 sm:left-2"
                  onClick={(event) => {
                    event.stopPropagation()
                    goPrev()
                  }}
                  size="icon"
                  type="button"
                  variant="outline"
                >
                  <ChevronLeft aria-hidden className="size-5" />
                </Button>
                <Button
                  aria-label="Next slide"
                  className="absolute right-0 top-1/2 size-11 -translate-y-1/2 rounded-full border-white/20 bg-black/50 text-white hover:bg-black/70 sm:right-2"
                  onClick={(event) => {
                    event.stopPropagation()
                    goNext()
                  }}
                  size="icon"
                  type="button"
                  variant="outline"
                >
                  <ChevronRight aria-hidden className="size-5" />
                </Button>
                <p className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-3 py-1 text-xs font-medium text-white">
                  {current + 1} / {total}
                </p>
              </>
            : null}
          </div>
        </div>,
        document.body,
      )
    : null

  function renderThumb(slide: GallerySlide, layout: 'row' | 'column') {
    const selected = slides.indexOf(slide) === current

    return (
      <button
        key={gallerySlideKey(slide)}
        type="button"
        aria-label={
          slide.kind === 'video' ? `View video ${slide.index + 1}` : `View image ${slide.index + 1}`
        }
        aria-current={selected ? 'true' : undefined}
        className={cn(
          'group/thumb relative aspect-square w-full touch-manipulation overflow-hidden rounded-lg outline-none transition-all duration-200',
          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          layout === 'column' ? 'max-w-full' : 'shrink-0',
          selected ?
            'ring-2 ring-orange-500 shadow-sm'
          : 'opacity-85 ring-1 ring-border/80 hover:opacity-100 hover:ring-orange-400/50',
        )}
        onClick={() => goTo(slides.indexOf(slide))}
      >
        {slide.kind === 'image' ?
          <GridTileImage
            accent="brand"
            active={selected}
            borderless
            clearBackground
            isInteractive={false}
            media={slide.image}
          />
        : galleryVideoThumbnailUrl(slide.videoUrl) ?
          <div className="relative h-full w-full">
            <Image
              alt=""
              className="object-cover"
              fill
              sizes="80px"
              src={galleryVideoThumbnailUrl(slide.videoUrl)!}
            />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/25">
              <Play className="size-4 fill-white text-white" aria-hidden />
            </div>
          </div>
        : <div className="flex h-full w-full items-center justify-center bg-muted">
            <Play className="size-4 fill-muted-foreground text-muted-foreground" aria-hidden />
          </div>
        }
        {selected ?
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 flex items-center justify-center bg-orange-500/10"
          >
            <span className="flex size-5 items-center justify-center rounded-full bg-orange-500 text-white shadow-sm">
              <Check aria-hidden className="size-3" strokeWidth={3} />
            </span>
          </span>
        : null}
      </button>
    )
  }

  function renderMainSlide(slide: GallerySlide) {
    const slidePosition = slides.indexOf(slide)
    const isActive = slidePosition === current

    if (slide.kind === 'image') {
      return (
        <button
          key={gallerySlideKey(slide)}
          type="button"
          aria-label="View image fullscreen"
          className={cn(
            'absolute inset-0 block h-full w-full cursor-zoom-in outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            isActive ? 'pointer-events-auto scale-100 opacity-100' : (
              'pointer-events-none scale-[1.02] opacity-0'
            ),
          )}
          onClick={() => setLightboxOpen(true)}
        >
          <Media
            resource={slide.image}
            fill
            className="absolute inset-0 block"
            imgClassName={cn(
              'object-contain object-top px-4 pt-4 pb-2 transition-transform duration-500 ease-out sm:px-6 sm:pt-6 sm:pb-3 md:px-8 md:pt-8 md:pb-4',
              isActive && 'group-hover/stage:scale-[1.03]',
            )}
            priority={slidePosition === 0}
            size="(max-width: 1024px) 100vw, 50vw"
          />
        </button>
      )
    }

    const isPlaying = playingVideoIndex === slide.index

    return (
      <div
        key={gallerySlideKey(slide)}
        className={cn(
          'absolute inset-0 transition-all duration-500 ease-out',
          isActive ? 'pointer-events-auto scale-100 opacity-100' : (
            'pointer-events-none scale-[1.02] opacity-0'
          ),
        )}
      >
        <GalleryVideoPlayer
          onPlayRequest={() => setPlayingVideoIndex(slide.index)}
          playing={isPlaying}
          url={slide.videoUrl}
        />
      </div>
    )
  }

  const activeIsVideo = activeSlide.kind === 'video'
  const activeVideoPlaying = activeIsVideo && playingVideoIndex === activeSlide.index

  return (
    <>
      <div className="flex w-full min-w-0 flex-col gap-3 sm:gap-4">
        <div className="flex w-full min-w-0 items-start gap-3 md:gap-4">
          {total > 1 ?
            <div
              aria-label="Product image thumbnails"
              className="hidden w-[4.5rem] shrink-0 flex-col gap-2.5 md:flex lg:w-20"
            >
              {slides.map((slide) => renderThumb(slide, 'column'))}
            </div>
          : null}

          <div className="group/stage relative min-w-0 w-full flex-1">
            <div
              className={cn(
                'relative aspect-[4/5] w-full overflow-hidden sm:aspect-square',
                mobileFullBleed ?
                  'rounded-none border-y border-border/50 sm:rounded-xl sm:border'
                : 'rounded-xl border border-border/70',
                'bg-white shadow-sm dark:bg-card',
              )}
            >
              <div className="relative h-full w-full">{slides.map((slide) => renderMainSlide(slide))}</div>

              {total > 1 ?
                <>
                  <Button
                    aria-label="Previous slide"
                    className="absolute left-2 top-1/2 z-10 size-9 -translate-y-1/2 rounded-full border-blue-200/80 bg-white/95 text-blue-600 shadow-sm hover:bg-white sm:left-3"
                    onClick={(event) => {
                      event.stopPropagation()
                      goPrev()
                    }}
                    size="icon"
                    type="button"
                    variant="outline"
                  >
                    <ChevronLeft aria-hidden className="size-5" />
                  </Button>
                  <Button
                    aria-label="Next slide"
                    className="absolute right-2 top-1/2 z-10 size-9 -translate-y-1/2 rounded-full border-blue-200/80 bg-white/95 text-blue-600 shadow-sm hover:bg-white sm:right-3"
                    onClick={(event) => {
                      event.stopPropagation()
                      goNext()
                    }}
                    size="icon"
                    type="button"
                    variant="outline"
                  >
                    <ChevronRight aria-hidden className="size-5" />
                  </Button>
                </>
              : null}

              <div className="pointer-events-none absolute right-3 top-3 flex items-center gap-2 sm:right-4 sm:top-4">
                {activeSlide.kind === 'image' ?
                  <span className="hidden rounded-full border border-border/60 bg-background/85 p-1.5 text-muted-foreground shadow-sm backdrop-blur-sm sm:inline-flex">
                    <ZoomIn aria-hidden className="size-3.5" />
                  </span>
                : activeVideoPlaying ? null : (
                  <span className="hidden rounded-full border border-border/60 bg-background/85 p-1.5 text-muted-foreground shadow-sm backdrop-blur-sm sm:inline-flex">
                    <Play aria-hidden className="size-3.5" />
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {total > 1 ?
          <>
            <div
              aria-label="Gallery position"
              className="flex justify-center gap-1.5 md:hidden"
              role="tablist"
            >
              {slides.map((slide, slideIndex) => (
                <button
                  key={`${gallerySlideKey(slide)}-dot`}
                  aria-label={`Go to slide ${slideIndex + 1}`}
                  aria-selected={slideIndex === current}
                  className={cn(
                    'size-2 rounded-full transition-all',
                    slideIndex === current ?
                      'w-5 bg-orange-500'
                    : 'bg-muted-foreground/35 hover:bg-muted-foreground/55',
                  )}
                  onClick={() => goTo(slideIndex)}
                  role="tab"
                  type="button"
                />
              ))}
            </div>

            <Carousel
              className={cn('w-full min-w-0 md:hidden', mobileFullBleed && 'px-1 sm:px-0')}
              opts={{ align: 'start', dragFree: true, loop: false }}
              setApi={setApi}
            >
              <CarouselContent className="-ml-2">
                {slides.map((slide) => (
                  <CarouselItem
                    className="basis-[26%] pl-2 sm:basis-[18%]"
                    key={`${gallerySlideKey(slide)}-mobile`}
                  >
                    {renderThumb(slide, 'row')}
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </>
        : null}
      </div>

      {lightbox}
    </>
  )
}
