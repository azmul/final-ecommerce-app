'use client'

import type { Media } from '@/payload-types'

import { Media as MediaCmp } from '@/components/Media'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel'
import { cmsBlockShellClassName } from '@/utilities/cmsLayout'
import { cn } from '@/utilities/cn'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'

export type FocusDiscountProductItem = {
  categoryLabel: string
  discountPercentage: number
  image: Media
  linkUrl?: string | null
}

type Props = {
  heading: string
  headingId: string
  items: FocusDiscountProductItem[]
}

function DiscountCard({ item }: { item: FocusDiscountProductItem }) {
  const discountDisplay =
    item.discountPercentage % 1 === 0
      ? String(Math.round(item.discountPercentage))
      : String(item.discountPercentage)

  const inner = (
    <article
      className={cn(
        'flex h-full w-[148px] shrink-0 flex-col overflow-hidden rounded-[10px] border border-[#E0F7FA] bg-white sm:w-[168px]',
        item.linkUrl && 'transition hover:shadow-md',
      )}
    >
      <div className="relative flex-[3] overflow-hidden bg-[radial-gradient(circle_at_50%_35%,#E8F4FC_0%,#F8FBFF_55%,#FFFFFF_100%)]">
        <div className="relative mx-auto flex size-full items-center justify-center p-3 sm:p-3.5">
          <MediaCmp
            className="relative h-[88px] w-full sm:h-[100px]"
            height={item.image.height ?? 100}
            imgClassName="mx-auto h-full w-full object-contain object-center"
            resource={item.image}
            width={item.image.width ?? 120}
          />
        </div>
      </div>

      <div className="flex flex-[1] items-stretch border-t border-[#E0F7FA]/80 bg-white">
        <div className="flex min-w-[3.75rem] shrink-0 flex-col items-center justify-center px-2 py-2.5 sm:min-w-[4rem] sm:px-2.5">
          <span className="text-xl font-bold leading-none text-[#D81B60] sm:text-2xl">
            {discountDisplay}%
          </span>
          <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider text-[#333333]/70 sm:text-[10px]">
            OFF
          </span>
        </div>
        <div aria-hidden className="my-2 w-px shrink-0 bg-[#333333]/15" />
        <div className="flex min-w-0 flex-1 items-center px-2 py-2 sm:px-2.5">
          <p className="line-clamp-2 text-[11px] font-medium leading-snug text-[#333333] sm:text-xs">
            {item.categoryLabel}
          </p>
        </div>
      </div>
    </article>
  )

  if (item.linkUrl?.trim()) {
    return (
      <Link
        aria-label={`${item.discountPercentage}% off — ${item.categoryLabel}`}
        className="block h-full outline-none focus-visible:ring-2 focus-visible:ring-[#D81B60]/40 focus-visible:ring-offset-2"
        href={item.linkUrl.trim()}
      >
        {inner}
      </Link>
    )
  }

  return inner
}

export function FocusDiscountProductClient({ heading, headingId, items }: Props) {
  const [carouselApi, setCarouselApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const [snapCount, setSnapCount] = useState(0)

  useEffect(() => {
    if (!carouselApi) return

    const onSelect = () => {
      setCurrent(carouselApi.selectedScrollSnap())
    }

    const onReInit = () => {
      setSnapCount(carouselApi.scrollSnapList().length)
      onSelect()
    }

    onReInit()
    carouselApi.on('select', onSelect)
    carouselApi.on('reInit', onReInit)

    return () => {
      carouselApi.off('select', onSelect)
      carouselApi.off('reInit', onReInit)
    }
  }, [carouselApi])

  if (!items.length) return null

  return (
    <section
      aria-labelledby={heading ? headingId : undefined}
      className={cn(
        cmsBlockShellClassName,
        'rounded-xl bg-[#FFF5F8] px-4 py-6 sm:px-6 sm:py-8',
      )}
    >
      {heading ? (
        <h2
          className="mb-6 text-center text-lg font-semibold tracking-tight text-[#333333] sm:mb-7 sm:text-xl"
          id={headingId}
        >
          {heading}
        </h2>
      ) : null}

      <Carousel
        className="relative w-full"
        opts={{
          align: 'start',
          dragFree: false,
          loop: items.length > 3,
          skipSnaps: false,
        }}
        setApi={setCarouselApi}
      >
        <CarouselContent className="-ml-3 sm:-ml-4">
          {items.map((item, index) => (
            <CarouselItem
              className="basis-auto pl-3 sm:pl-4"
              key={`${item.categoryLabel}-${index}`}
            >
              <DiscountCard item={item} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {snapCount > 1 ? (
        <div aria-label="Carousel pages" className="mt-6 flex items-center justify-center gap-2">
          {Array.from({ length: snapCount }).map((_, index) => (
            <button
              aria-current={index === current ? 'true' : undefined}
              aria-label={`Go to slide ${index + 1}`}
              className={cn(
                'rounded-full transition',
                index === current
                  ? 'h-2 w-6 bg-[#D81B60]'
                  : 'size-2 bg-[#333333]/20 hover:bg-[#333333]/35',
              )}
              key={index}
              onClick={() => carouselApi?.scrollTo(index)}
              type="button"
            />
          ))}
        </div>
      ) : null}
    </section>
  )
}
