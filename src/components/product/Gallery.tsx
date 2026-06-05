'use client'

import type { Product } from '@/payload-types'

import { GridTileImage } from '@/components/Grid/tile'
import { Media } from '@/components/Media'
import { Button } from '@/components/ui/button'
import { Carousel, CarouselApi, CarouselContent, CarouselItem } from '@/components/ui/carousel'
import { cn } from '@/utilities/cn'
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { DefaultDocumentIDType } from 'payload'
import React, { useCallback, useEffect, useState } from 'react'

type Props = {
  gallery: NonNullable<Product['gallery']>
}

type GallerySlide = {
  image: NonNullable<Product['gallery']>[number]['image']
  index: number
}

function resolveSlides(gallery: NonNullable<Product['gallery']>): GallerySlide[] {
  return gallery.flatMap((item, index) => {
    if (typeof item.image !== 'object' || !item.image) return []
    return [{ image: item.image, index }]
  })
}

export const Gallery: React.FC<Props> = ({ gallery }) => {
  const searchParams = useSearchParams()
  const slides = resolveSlides(gallery)
  const [current, setCurrent] = useState(0)
  const [api, setApi] = useState<CarouselApi>()
  const [lightboxOpen, setLightboxOpen] = useState(false)

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
      goTo(index)
    }
  }, [searchParams, api, gallery, goTo])

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

  function renderThumb(slide: GallerySlide, layout: 'row' | 'column') {
    const selected = slide.index === current

    return (
      <button
        key={`${slide.image.id}-${slide.index}`}
        type="button"
        aria-label={`View image ${slide.index + 1}`}
        aria-current={selected ? 'true' : undefined}
        className={cn(
          'group/thumb relative aspect-square w-full touch-manipulation overflow-hidden rounded-xl outline-none transition-all duration-200',
          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          layout === 'column' ? 'max-w-full' : 'shrink-0',
          selected ?
            'ring-2 ring-primary shadow-md shadow-primary/15'
          : 'opacity-80 ring-1 ring-border/70 hover:opacity-100 hover:ring-primary/40',
        )}
        onClick={() => goTo(slide.index)}
      >
        <GridTileImage
          accent="brand"
          active={selected}
          borderless
          clearBackground
          isInteractive={false}
          media={slide.image}
        />
        <span
          aria-hidden
          className={cn(
            'pointer-events-none absolute inset-0 rounded-xl transition-colors',
            selected ? 'bg-primary/6' : 'bg-transparent group-hover/thumb:bg-primary/4',
          )}
        />
      </button>
    )
  }

  return (
    <>
      <div className="flex w-full min-w-0 flex-col gap-4 sm:gap-5">
        <div className="group/stage relative min-w-0 w-full">
            <div
              className={cn(
                'relative aspect-square w-full overflow-hidden rounded-2xl sm:rounded-3xl',
                'border border-border/60 bg-linear-to-br from-muted/50 via-background to-muted/30',
                'shadow-[0_20px_50px_-24px_rgba(0,0,0,0.35)] dark:shadow-[0_24px_60px_-28px_rgba(0,0,0,0.65)]',
                'ring-1 ring-inset ring-white/40 dark:ring-white/8',
              )}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.65),transparent_58%)] dark:bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.08),transparent_58%)]"
              />

              <button
                type="button"
                aria-label="View image fullscreen"
                className="relative block h-full w-full cursor-zoom-in outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                onClick={() => setLightboxOpen(true)}
              >
                {slides.map((slide) => (
                  <div
                    key={`${slide.image.id}-${slide.index}-main`}
                    className={cn(
                      'absolute inset-0 transition-all duration-500 ease-out',
                      slide.index === current ?
                        'pointer-events-auto scale-100 opacity-100'
                      : 'pointer-events-none scale-[1.02] opacity-0',
                    )}
                  >
                    <Media
                      resource={slide.image}
                      fill
                      className="absolute inset-0 block"
                      imgClassName={cn(
                        'object-contain object-top px-4 pt-4 pb-2 transition-transform duration-500 ease-out sm:px-6 sm:pt-6 sm:pb-3 md:px-8 md:pt-8 md:pb-4',
                        slide.index === current && 'group-hover/stage:scale-[1.03]',
                      )}
                      priority={slide.index === 0}
                      size="(max-width: 1024px) 100vw, 50vw"
                    />
                  </div>
                ))}
              </button>

              {total > 1 ?
                <>
                  <Button
                    aria-label="Previous image"
                    className="absolute left-3 top-1/2 z-10 size-10 -translate-y-1/2 rounded-full border-border/70 bg-background/90 opacity-100 shadow-md backdrop-blur-sm transition-opacity sm:left-4 sm:opacity-0 sm:group-hover/stage:opacity-100"
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
                    aria-label="Next image"
                    className="absolute right-3 top-1/2 z-10 size-10 -translate-y-1/2 rounded-full border-border/70 bg-background/90 opacity-100 shadow-md backdrop-blur-sm transition-opacity sm:right-4 sm:opacity-0 sm:group-hover/stage:opacity-100"
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

              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-linear-to-t from-background/30 via-background/5 to-transparent" />

              <div className="pointer-events-none absolute right-3 top-3 flex items-center gap-2 sm:right-4 sm:top-4">
                {total > 1 ?
                  <span className="rounded-full border border-border/60 bg-background/85 px-2.5 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur-sm">
                    {current + 1} / {total}
                  </span>
                : null}
                <span className="hidden rounded-full border border-border/60 bg-background/85 p-1.5 text-muted-foreground shadow-sm backdrop-blur-sm sm:inline-flex">
                  <ZoomIn aria-hidden className="size-3.5" />
                </span>
              </div>
            </div>
        </div>

        {total > 1 ?
          <Carousel
            className="w-full min-w-0"
            opts={{ align: 'start', dragFree: true, loop: false }}
            setApi={setApi}
          >
            <CarouselContent className="-ml-2">
              {slides.map((slide) => (
                <CarouselItem
                  className="basis-[22%] pl-2 sm:basis-[18%] md:basis-[15%]"
                  key={`${slide.image.id}-${slide.index}-mobile`}
                >
                  {renderThumb(slide, 'row')}
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        : null}
      </div>

      {lightboxOpen ?
        <div
          aria-label="Product image fullscreen view"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/88 p-4 backdrop-blur-sm sm:p-8"
          role="dialog"
        >
          <button
            type="button"
            aria-label="Close fullscreen view"
            className="absolute inset-0 cursor-zoom-out"
            onClick={() => setLightboxOpen(false)}
          />
          <div className="relative z-10 flex h-full w-full max-w-5xl items-center justify-center">
            <Media
              resource={activeSlide.image}
              className="relative max-h-full max-w-full"
              imgClassName="max-h-[85vh] w-auto max-w-full object-contain"
              priority
              size="100vw"
            />
            {total > 1 ?
              <>
                <Button
                  aria-label="Previous image"
                  className="absolute left-0 top-1/2 size-11 -translate-y-1/2 rounded-full border-white/20 bg-black/50 text-white hover:bg-black/70 sm:left-2"
                  onClick={goPrev}
                  size="icon"
                  type="button"
                  variant="outline"
                >
                  <ChevronLeft aria-hidden className="size-5" />
                </Button>
                <Button
                  aria-label="Next image"
                  className="absolute right-0 top-1/2 size-11 -translate-y-1/2 rounded-full border-white/20 bg-black/50 text-white hover:bg-black/70 sm:right-2"
                  onClick={goNext}
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
        </div>
      : null}
    </>
  )
}
