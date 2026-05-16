'use client'

import type { Media, Product } from '@/payload-types'

import { Media as MediaCmp } from '@/components/Media'
import { Price } from '@/components/Price'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel'
import { cmsBlockShellClassName } from '@/utilities/cmsLayout'
import { cn } from '@/utilities/cn'
import { ArrowRight, Gift } from 'lucide-react'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'

function ComboDealCard({ product }: { product: Partial<Product> }) {
  const { gallery, title, slug } = product

  let price = product.priceInBDT
  const variants = product.variants?.docs
  if (variants?.length) {
    const variant = variants[0]
    if (variant && typeof variant === 'object' && typeof variant.priceInBDT === 'number') {
      price = variant.priceInBDT
    }
  }

  const image =
    gallery?.[0]?.image && typeof gallery[0].image !== 'string' ? gallery[0].image : null

  const itemURL = slug ? `/products/${slug}` : '#'
  const mainPrice = typeof price === 'number' ? price : undefined
  const discountFromField =
    typeof product.discountPercentage === 'number' ? product.discountPercentage : 0
  const discountPercent = Math.min(Math.max(discountFromField, 0), 100)
  const hasDiscount = discountPercent > 0
  const discountedPrice =
    typeof mainPrice === 'number' && hasDiscount
      ? Math.round(mainPrice * (100 - discountPercent)) / 100
      : mainPrice

  const saveLabel =
    discountPercent % 1 === 0
      ? `Save ${Math.round(discountPercent)}%`
      : `Save ${discountPercent}%`

  return (
    <article
      className={cn(
        'relative flex h-full min-h-0 flex-col rounded-xl border border-border/80 bg-card p-3 shadow-sm sm:p-3.5',
      )}
    >
      <div className="pointer-events-none absolute inset-x-2.5 top-2.5 z-10 flex items-start justify-between gap-2 sm:inset-x-3 sm:top-3">
        {hasDiscount ? (
          <span className="rounded bg-success px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground shadow-sm sm:text-[11px]">
            {saveLabel}
          </span>
        ) : (
          <span />
        )}
        <span className="rounded bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground shadow-sm sm:text-[11px]">
          Combo Offer
        </span>
      </div>

      <Link
        aria-label={`View ${title ?? 'combo'}`}
        className="relative z-[1] mx-auto mb-3 flex aspect-[4/3] w-full shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted/25 p-2"
        href={itemURL}
      >
        {image ? (
          <MediaCmp
            className="relative size-full"
            fill
            imgClassName="object-contain transition duration-300 hover:opacity-95"
            resource={image as Media}
          />
        ) : (
          <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
            No image
          </div>
        )}
      </Link>

      <div className="relative z-[1] flex min-h-0 flex-1 flex-col gap-2.5">
        <Link className="block min-h-0" href={itemURL}>
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-snug text-foreground underline-offset-4 hover:text-primary hover:underline sm:min-h-[2.75rem] sm:text-[0.9375rem]">
            {title}
          </h3>
        </Link>

        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          {typeof discountedPrice === 'number' ? (
            <Price
              amount={discountedPrice}
              as="span"
              className="text-lg font-bold tabular-nums text-primary sm:text-xl"
            />
          ) : null}
          {hasDiscount && typeof mainPrice === 'number' ? (
            <Price
              amount={mainPrice}
              as="span"
              className="text-sm font-medium tabular-nums text-muted-foreground line-through"
            />
          ) : null}
        </div>

        <div className="mt-auto pt-1">
          <Link
            className="flex min-h-10 w-full items-center justify-center rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
            href={itemURL}
          >
            View Details
          </Link>
        </div>
      </div>
    </article>
  )
}

type Props = {
  heading: string
  headingId: string
  products: Partial<Product>[]
  viewAllUrl: string
}

export function ExclusiveComboDealsClient({ heading, headingId, products, viewAllUrl }: Props) {
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

  if (!products.length) return null

  return (
    <section
      aria-labelledby={headingId}
      className={cn(cmsBlockShellClassName, 'rounded-xl bg-muted/35 px-4 py-6 sm:px-6 sm:py-8')}
    >
      <div className="mb-6 flex flex-col gap-4 sm:mb-7 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden
            className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm sm:size-11"
          >
            <Gift className="size-5 sm:size-[1.35rem]" strokeWidth={2.25} />
          </span>
          <h2
            className="text-lg font-bold tracking-tight text-foreground sm:text-xl md:text-2xl"
            id={headingId}
          >
            {heading}
          </h2>
        </div>
        {viewAllUrl ? (
          <Link
            className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 sm:self-auto"
            href={viewAllUrl}
          >
            View All Combos
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        ) : null}
      </div>

      <Carousel
        className="relative w-full"
        opts={{
          align: 'start',
          dragFree: false,
          loop: products.length > 4,
          skipSnaps: false,
        }}
        setApi={setCarouselApi}
      >
        <CarouselContent className="-ml-3 sm:-ml-4">
          {products.map((product) =>
            product.id ? (
              <CarouselItem
                className="basis-[82%] pl-3 min-[480px]:basis-[48%] sm:basis-[46%] sm:pl-4 md:basis-[32%] lg:basis-[24%] xl:basis-[19.5%]"
                key={product.id}
              >
                <ComboDealCard product={product} />
              </CarouselItem>
            ) : null,
          )}
        </CarouselContent>
      </Carousel>

      {snapCount > 1 ? (
        <div aria-label="Carousel pages" className="mt-6 flex justify-center gap-2">
          {Array.from({ length: snapCount }).map((_, index) => (
            <button
              aria-current={index === current ? 'true' : undefined}
              aria-label={`Go to slide ${index + 1}`}
              className={cn(
                'size-2.5 rounded-full transition sm:size-2',
                index === current ? 'scale-110 bg-primary' : 'bg-primary/25 hover:bg-primary/40',
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
