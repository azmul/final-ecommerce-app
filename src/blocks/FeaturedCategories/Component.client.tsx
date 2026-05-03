'use client'

import type { Category, Media } from '@/payload-types'

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { Media as MediaCmp } from '@/components/Media'
import { cmsBlockShellClassName } from '@/utilities/cmsLayout'
import { cn } from '@/utilities/cn'
import AutoScroll from 'embla-carousel-auto-scroll'
import Link from 'next/link'
import React from 'react'

type Props = {
  heading: string
  categories: Category[]
}

export const FeaturedCategoriesClient: React.FC<Props> = ({ heading, categories }) => {
  if (!categories.length) return null

  const loopSlides = [...categories, ...categories, ...categories]

  return (
    <section aria-labelledby="featured-categories-heading" className={cn(cmsBlockShellClassName)}>
      <h2
        className="mb-10 text-center text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
        id="featured-categories-heading"
      >
        {heading}
      </h2>

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
          aria-label="Scroll categories backward"
          className={cn(
            'pointer-events-auto z-10 h-11 w-11 border-0 bg-white/85 text-neutral-600 shadow-sm hover:bg-white dark:bg-muted dark:text-muted-foreground',
            'left-[var(--carousel-offset)]',
          )}
        />
        <CarouselNext
          aria-label="Scroll categories forward"
          className={cn(
            'pointer-events-auto z-10 h-11 w-11 border-0 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:text-primary-foreground disabled:opacity-40',
            'right-[var(--carousel-offset)]',
          )}
        />
        <CarouselContent className="-ml-6 pb-2 sm:-ml-8">
          {loopSlides.map((category, index) => {
            const media =
              category.image &&
              typeof category.image === 'object' &&
              category.image !== null
                ? (category.image as Media)
                : undefined

            return (
              <CarouselItem
                className="min-w-0 shrink-0 grow-0 basis-auto pl-6 sm:pl-8"
                key={`${category.id}-${index}`}
              >
                <Link
                  className="group flex w-[100px] shrink-0 flex-col items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  href={
                    typeof category.slug === 'string' && category.slug.length > 0
                      ? `/shop/${category.slug}`
                      : '/shop'
                  }
                >
                  <div
                    className={cn(
                      'flex size-[100px] shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-transparent bg-white shadow-sm transition',
                      'group-hover:border-primary/35 group-hover:shadow-md',
                      'dark:bg-card dark:group-hover:border-primary/35',
                    )}
                  >
                    {media?.url || media?.filename ? (
                      <MediaCmp
                        className="h-full w-full object-contain"
                        height={media.height ?? 100}
                        imgClassName="h-full w-full object-contain"
                        resource={media}
                        width={media.width ?? 100}
                      />
                    ) : (
                      <span className="text-2xl font-semibold text-muted-foreground/60" aria-hidden>
                        {category.title.slice(0, 1)}
                      </span>
                    )}
                  </div>
                  <span className="line-clamp-2 w-full max-w-[100px] text-center text-sm font-medium leading-tight text-foreground">
                    {category.title}
                  </span>
                </Link>
              </CarouselItem>
            )
          })}
        </CarouselContent>
      </Carousel>
    </section>
  )
}
