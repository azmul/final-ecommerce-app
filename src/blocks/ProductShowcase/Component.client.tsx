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
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { ArrowRight, ShoppingCartIcon } from 'lucide-react'
import Link from 'next/link'
import React, { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { cmsBlockShellClassName } from '@/utilities/cmsLayout'
import { cn } from '@/utilities/cn'

function ProductShowcaseCard({ product }: { product: Partial<Product> }) {
  const { gallery, title, slug, enableVariants } = product
  const { addItem, isLoading } = useCart()

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
    typeof product.discountPercentage === 'number' ? Math.round(product.discountPercentage) : 0
  const discountPercent = Math.min(Math.max(discountFromField, 0), 100)
  const hasDiscount = discountPercent > 0
  const discountedPrice =
    typeof mainPrice === 'number' && hasDiscount
      ? Math.round(mainPrice * (100 - discountPercent)) / 100
      : mainPrice

  const productBadge =
    typeof product.productBadge === 'string' ? product.productBadge.trim() : undefined

  const inventory = product.inventory ?? 0
  const canAddSimple = Boolean(product.id) && !enableVariants
  const isSoldOut = !enableVariants && inventory <= 0

  const actionClass =
    'flex min-h-10 w-full touch-manipulation select-none items-center justify-center gap-2 rounded-lg border border-primary bg-white px-3 py-2 text-sm font-semibold text-primary shadow-sm hover:bg-primary/5 active:opacity-90 disabled:pointer-events-none disabled:opacity-55 dark:bg-muted dark:hover:bg-accent'

  const addProductToCart = useCallback(() => {
    if (!product.id) return
    void Promise.resolve(addItem({ product: product.id })).then(() => {
      toast.success('Item added to cart.')
    })
  }, [addItem, product.id])

  return (
    <article
      className={cn(
        'relative flex h-full min-h-0 flex-col rounded-xl border border-neutral-200/90 bg-white p-3 shadow-[0_6px_24px_-10px_rgba(0,0,0,0.14)] dark:border-border dark:bg-card dark:shadow-md',
      )}
    >
      {productBadge ? (
        <div className="pointer-events-none absolute left-2 top-2 z-10 max-w-[calc(100%-4rem)] rounded px-2 py-1 text-[10px] font-bold uppercase leading-tight tracking-wide text-white shadow-sm sm:left-2.5 sm:top-2.5 sm:text-[11px]">
          <span className="block truncate rounded bg-primary px-2 py-0.5 text-primary-foreground">{productBadge}</span>
        </div>
      ) : null}

      {hasDiscount ? (
        <div className="pointer-events-none absolute right-2 top-2 z-10 rounded border border-border bg-muted/60 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-foreground shadow-sm sm:right-2.5 sm:top-2.5 sm:text-[11px]">
          Save {discountPercent}%
        </div>
      ) : null}

      <Link
        aria-label={`View ${title ?? 'product'}`}
        className="relative z-[1] mx-auto mb-3 flex aspect-square w-full max-w-[200px] shrink-0 items-center justify-center overflow-hidden rounded-lg border border-muted/60 bg-muted/20 p-2 sm:max-w-none"
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

      <div className="relative z-[1] flex min-h-0 flex-1 flex-col gap-2">
        <Link className="block min-h-0" href={itemURL}>
          <h3 className="line-clamp-2 min-h-[2.5rem] text-center text-sm font-semibold leading-snug text-foreground underline-offset-4 hover:text-primary hover:underline sm:min-h-[2.75rem] sm:text-[0.9375rem]">
            {title}
          </h3>
        </Link>

        <div className="flex flex-wrap items-baseline justify-center gap-x-2 gap-y-0.5">
          {typeof discountedPrice === 'number' ? (
            <Price
              amount={discountedPrice}
              as="span"
              className="text-base font-bold tabular-nums text-primary"
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

        <div className="mt-auto pt-2">
          {enableVariants ? (
            <Link className={cn(actionClass)} href={itemURL}>
              <ShoppingCartIcon className="size-4 shrink-0" />
              Add To Cart
            </Link>
          ) : (
            <button
              className={cn(actionClass)}
              disabled={!canAddSimple || isSoldOut || isLoading}
              onClick={addProductToCart}
              type="button"
            >
              <ShoppingCartIcon className="size-4 shrink-0" />
              {isSoldOut ? 'Sold Out' : 'Add To Cart'}
            </button>
          )}
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

export function ProductShowcaseClient({ heading, headingId, products, viewAllUrl }: Props) {
  const [carouselApi, setCarouselApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const [snapCount, setSnapCount] = useState(0)

  const hasSpaceInHeading = heading.includes(' ')
  const [firstWord, ...restWords] = hasSpaceInHeading ? heading.split(' ') : [heading]
  const restTitle = restWords.join(' ')

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
    <section aria-labelledby={headingId} className={cn(cmsBlockShellClassName)}>
      <div className="px-0">
        <div className="mb-6 flex flex-row items-end justify-between gap-3 sm:mb-7">
          <div className="min-w-0 flex-1 pr-2">
            <h2
              className="text-xl font-bold tracking-tight text-foreground sm:text-2xl"
              id={headingId}
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
          {viewAllUrl ? (
            <Link
              className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold uppercase tracking-wide text-primary transition hover:text-primary/90 sm:text-sm"
              href={viewAllUrl}
            >
              View all items
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
                  <ProductShowcaseCard product={product} />
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
                  index === current
                    ? 'scale-110 bg-primary'
                    : 'border border-primary bg-transparent',
                )}
                key={index}
                onClick={() => carouselApi?.scrollTo(index)}
                type="button"
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
