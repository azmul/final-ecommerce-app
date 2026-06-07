'use client'

import type { CarouselApi } from '@/components/ui/carousel'
import type { Media } from '@/payload-types'

import { Media as MediaCmp } from '@/components/Media'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { cn } from '@/utilities/cn'
import Autoplay from 'embla-carousel-autoplay'
import Link from 'next/link'
import React from 'react'

export type PromoCarouselSplitSlide = {
  href: string
  media: Media
}

const tileFrameClass =
  'relative block w-full overflow-hidden rounded-2xl border border-border/70 shadow-md'

const tileHeightClass = 'h-[clamp(12rem,22vw,18rem)] sm:h-[clamp(13rem,24vw,20rem)]'

type Props = {
  slides: PromoCarouselSplitSlide[]
  right: { href: string; media: Media }
}

const AUTOPLAY_DELAY_MS = 5000

export function PromoCarouselSplitClient({ slides, right }: Props) {
  const [api, setApi] = React.useState<CarouselApi>()
  const [selected, setSelected] = React.useState(0)

  const autoplayPlugin = React.useMemo(
    () =>
      slides.length > 1
        ? Autoplay({
            delay: AUTOPLAY_DELAY_MS,
            playOnInit: true,
            stopOnInteraction: false,
            stopOnMouseEnter: true,
            stopOnFocusIn: false,
          })
        : undefined,
    [slides.length],
  )

  const plugins = autoplayPlugin ? [autoplayPlugin] : []

  React.useEffect(() => {
    if (!api || slides.length <= 1) return
    const onSelect = () => setSelected(api.selectedScrollSnap())
    api.on('select', onSelect)
    const frame = requestAnimationFrame(onSelect)
    return () => {
      cancelAnimationFrame(frame)
      api.off('select', onSelect)
    }
  }, [api, slides.length])

  const rightLabel =
    typeof right.media.alt === 'string' && right.media.alt.trim()
      ? right.media.alt.trim()
      : 'Promotional banner'

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)] lg:gap-5 lg:items-stretch">
      <div className={cn(tileFrameClass, tileHeightClass, 'min-h-0')}>
        <Carousel
          className={cn(
            'absolute inset-0 [&_[data-slot=carousel-content]]:h-full [--carousel-inset:0.625rem]',
            slides.length <= 1 && '[&_[data-slot=carousel-previous]]:hidden [&_[data-slot=carousel-next]]:hidden',
          )}
          opts={{
            align: 'start',
            duration: 32,
            loop: slides.length > 1,
          }}
          plugins={plugins}
          setApi={setApi}
        >
          <CarouselPrevious
            className={cn(
              'pointer-events-auto z-20 size-9 rounded-md border-0 bg-white/90 text-primary shadow-sm hover:bg-white hover:text-primary/90 sm:size-10',
              'left-[var(--carousel-inset)]',
            )}
          />
          <CarouselNext
            className={cn(
              'pointer-events-auto z-20 size-9 rounded-md border-0 bg-white/90 text-primary shadow-sm hover:bg-white hover:text-primary/90 sm:size-10',
              'right-[var(--carousel-inset)]',
            )}
          />
          <CarouselContent className="ml-0 h-full">
            {slides.map((slide, index) => {
              const label =
                typeof slide.media.alt === 'string' && slide.media.alt.trim()
                  ? slide.media.alt.trim()
                  : `Promotional slide ${index + 1}`

              const showPanMotion = slides.length <= 1 || selected === index

              return (
                <CarouselItem className="h-full pl-0" key={`${slide.media.id}-${index}`}>
                  <Link
                    aria-label={label}
                    className="group relative block size-full outline-none ring-offset-2 transition hover:opacity-[0.98] focus-visible:ring-2 focus-visible:ring-ring"
                    href={slide.href}
                  >
                    <MediaCmp
                      className="absolute inset-0 size-full overflow-hidden"
                      fill
                      imgClassName={cn(
                        'object-cover',
                        showPanMotion ? 'promo-carousel-pan-motion' : '',
                        !showPanMotion &&
                          'transition duration-300 ease-out group-hover:scale-[1.02]',
                      )}
                      resource={slide.media}
                    />
                  </Link>
                </CarouselItem>
              )
            })}
          </CarouselContent>
          {slides.length > 1 ? (
            <div
              className="absolute bottom-3 left-3 z-20 flex gap-1.5 sm:bottom-4 sm:left-4"
              role="tablist"
              aria-label="Slides"
            >
              {slides.map((_, i) => (
                <button
                  aria-current={i === selected ? 'true' : undefined}
                  aria-label={`Slide ${i + 1}`}
                  className={cn(
                    'size-2 rounded-full shadow-sm ring-1 ring-black/10 transition sm:size-2.5',
                    i === selected
                      ? 'bg-primary'
                      : 'bg-white/90 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  )}
                  key={i}
                  onClick={() => api?.scrollTo(i)}
                  type="button"
                />
              ))}
            </div>
          ) : null}
        </Carousel>
      </div>

      <Link
        aria-label={rightLabel}
        className={cn(
          tileFrameClass,
          tileHeightClass,
          'group relative block outline-none ring-offset-2 transition hover:opacity-[0.98] focus-visible:ring-2 focus-visible:ring-ring',
        )}
        href={right.href}
      >
        <MediaCmp
          className="absolute inset-0 size-full"
          fill
          imgClassName="object-cover transition duration-300 ease-out group-hover:scale-[1.02]"
          resource={right.media}
        />
      </Link>
    </div>
  )
}
