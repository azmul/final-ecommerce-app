'use client'

import type { Media } from '@/payload-types'

import { Media as MediaCmp } from '@/components/Media'
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
import React, { useMemo } from 'react'

export type TestimonialEntry = {
  id?: string | null
  quote: string
  name: string
  role?: string | null
  photo: Media
}

function TestimonialCard({ entry }: { entry: TestimonialEntry }) {
  const { quote, name, role, photo } = entry

  return (
    <article
      className={cn(
        'group flex h-full flex-col rounded-xl border border-neutral-200/90 p-5 transition-shadow duration-300 dark:border-border',
        'hover:shadow-md dark:hover:shadow-lg',
      )}
    >
      <blockquote className="mb-6 flex-1 text-left text-sm leading-relaxed text-foreground sm:text-base">
        <p className="whitespace-pre-wrap">{quote}</p>
      </blockquote>
      <footer className="flex items-center gap-3 border-t border-border/50 pt-4">
        <div className="relative size-12 shrink-0 overflow-hidden rounded-full border border-border/60 bg-muted shadow-sm ring-0 ring-offset-2 transition duration-300 ease-out group-hover:ring-2 group-hover:ring-primary/35 sm:size-14">
          <MediaCmp
            className="absolute inset-0 size-full"
            fill
            imgClassName="object-cover transition duration-300 ease-out group-hover:scale-105"
            resource={photo}
          />
        </div>
        <div className="min-w-0 text-left">
          <p className="truncate font-bold text-foreground">{name}</p>
          {role?.trim() ? (
            <p className="truncate text-sm text-muted-foreground">{role.trim()}</p>
          ) : null}
        </div>
      </footer>
    </article>
  )
}

type Props = {
  items: TestimonialEntry[]
}

export function TestimonialsClient({ items }: Props) {
  const loopSlides = useMemo(() => [...items, ...items, ...items], [items])

  if (!items.length) return null

  return (
    <section
      aria-label="Customer testimonials"
      className={cn(cmsBlockShellClassName, 'pb-8 sm:pb-10')}
    >
      <div className="px-0">
        <Carousel
          className="relative w-full [--carousel-offset:-0.75rem]"
          opts={{ align: 'start', dragFree: true, loop: true, skipSnaps: false }}
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
            aria-label="Scroll testimonials backward"
            className={cn(
              'pointer-events-auto z-10 h-11 w-11 border-0 bg-white/85 text-neutral-600 shadow-sm hover:bg-white dark:bg-muted dark:text-muted-foreground',
              'left-(--carousel-offset)',
            )}
          />
          <CarouselNext
            aria-label="Scroll testimonials forward"
            className={cn(
              'pointer-events-auto z-10 h-11 w-11 border-0 bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:text-primary-foreground disabled:opacity-40',
              'right-(--carousel-offset)',
            )}
          />
          <CarouselContent className="-ml-6 pb-2 sm:-ml-8">
            {loopSlides.map((entry, index) => (
              <CarouselItem
                className="min-w-0 shrink-0 grow-0 basis-auto pl-6 sm:pl-8"
                key={`${entry.id ?? entry.name}-${index}`}
              >
                <div className="w-[min(100vw-5rem,340px)] sm:w-[320px] md:w-[340px] lg:w-[360px]">
                  <TestimonialCard entry={entry} />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  )
}
