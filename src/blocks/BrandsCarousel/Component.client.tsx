'use client'

import type { Brand, Media as MediaDoc } from '@/payload-types'

import { Media } from '@/components/Media'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { cmsBlockShellClassName } from '@/utilities/cmsLayout'
import { cn } from '@/utilities/cn'
import AutoScroll from 'embla-carousel-auto-scroll'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import React, { useMemo } from 'react'

type Props = {
  brands: Brand[]
  heading: string
}

export function BrandsCarouselClient({ brands, heading }: Props) {
  const loopSlides = useMemo(() => [...brands, ...brands, ...brands], [brands])

  const hasSpaceInHeading = heading.includes(' ')
  const [firstWord, ...restWords] = hasSpaceInHeading ? heading.split(' ') : [heading]
  const restTitle = restWords.join(' ')

  return (
    <section
      aria-labelledby="brands-carousel-heading"
      className={cn(cmsBlockShellClassName)}
    >
      <div className="px-0 sm:px-0">
        <div className="mb-6 flex flex-row items-center justify-between gap-3 sm:mb-8 sm:items-end">
          <div className="min-w-0 flex-1 pr-2">
            <h2
              className="text-xl font-bold tracking-tight text-foreground sm:text-2xl"
              id="brands-carousel-heading"
            >
              {hasSpaceInHeading ? (
                <>
                  <span className="relative inline-block pr-1">
                    {firstWord}
                    <span
                      aria-hidden
                      className="absolute -bottom-1 left-0 h-1 w-10 rounded-full bg-primary sm:w-12"
                    />
                  </span>
                  {restTitle ? <> {restTitle}</> : null}
                </>
              ) : (
                <span className="relative inline-block">
                  {heading}
                  <span
                    aria-hidden
                    className="absolute -bottom-1 left-0 h-1 w-10 rounded-full bg-primary sm:w-12"
                  />
                </span>
              )}
            </h2>
          </div>
          <Link
            className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold uppercase tracking-wide text-primary transition hover:text-primary/90 sm:text-base"
            href="/all-brands"
          >
            See all
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        </div>
        <div aria-hidden className="mb-6 h-px w-full bg-border sm:mb-8" />

        <Carousel
          className="relative w-full [--carousel-offset:-0.75rem]"
          opts={{ align: 'start', dragFree: true, loop: true }}
          plugins={[
            AutoScroll({
              direction: 'forward',
              playOnInit: true,
              speed: 0.85,
              stopOnInteraction: false,
              stopOnMouseEnter: true,
              stopOnFocusIn: false,
            }),
          ]}
        >
          <CarouselPrevious
            aria-label="Scroll brands backward"
            className={cn(
              'pointer-events-auto z-10 h-11 w-11 border-0 bg-white/85 text-neutral-600 shadow-sm hover:bg-white dark:bg-muted dark:text-muted-foreground',
              'left-[var(--carousel-offset)]',
            )}
          />
          <CarouselNext
            aria-label="Scroll brands forward"
            className={cn(
              'pointer-events-auto z-10 h-11 w-11 border-0 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:text-primary-foreground disabled:opacity-40',
              'right-[var(--carousel-offset)]',
            )}
          />
          <CarouselContent className="-ml-6 pb-2 sm:-ml-8">
            {loopSlides.map((brand, index) => {
              const media =
                brand.image &&
                typeof brand.image === 'object' &&
                'url' in brand.image &&
                (brand.image.url || brand.image.filename)
                  ? (brand.image as MediaDoc)
                  : undefined

              return (
                <CarouselItem
                  className="min-w-0 shrink-0 grow-0 basis-auto pl-6 sm:pl-8"
                  key={`${brand.id}-${index}`}
                >
                  <Link
                    aria-label={`${brand.title} — view brand products`}
                    className="group flex w-[164px] shrink-0 flex-col items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:w-[184px]"
                    href={`/brand/${brand.slug.trim()}`}
                  >
                    <div
                      className={cn(
                        'relative aspect-video flex w-full shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-transparent bg-white shadow-sm transition',
                        'group-hover:border-primary/35 group-hover:shadow-md',
                        'dark:bg-card dark:group-hover:border-primary/35',
                      )}
                    >
                      {media ? (
                        <Media
                          className="relative size-full"
                          fill
                          imgClassName="object-contain object-center p-2 transition duration-300 ease-in-out group-hover:scale-105 sm:p-2.5"
                          resource={media}
                        />
                      ) : (
                        <span
                          aria-hidden
                          className="text-3xl font-semibold text-muted-foreground/60 sm:text-4xl"
                        >
                          {brand.title.slice(0, 1)}
                        </span>
                      )}
                    </div>
                    <span className="line-clamp-2 w-full max-w-[164px] text-center text-sm font-medium leading-tight text-foreground sm:max-w-[184px] sm:text-base">
                      {brand.title}
                    </span>
                  </Link>
                </CarouselItem>
              )
            })}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  )
}
