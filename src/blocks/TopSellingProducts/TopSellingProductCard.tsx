import type { Media, Product } from '@/payload-types'

import { Media as MediaCmp } from '@/components/Media'
import { Price } from '@/components/Price'
import { TopSellingProductActions } from '@/blocks/TopSellingProducts/TopSellingProductActions'
import { PRODUCT_CARD_IMAGE_SIZES } from '@/lib/seo/imageSizes'
import { Tag } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import { cn } from '@/utilities/cn'

function resolvePrice(product: Partial<Product>): number | undefined {
  let price = product.priceInBDT
  const variants = product.variants?.docs
  if (variants?.length) {
    const variant = variants[0]
    if (variant && typeof variant === 'object' && typeof variant.priceInBDT === 'number') {
      price = variant.priceInBDT
    }
  }
  return typeof price === 'number' ? price : undefined
}

export function TopSellingProductCard({
  product,
  priority = false,
}: {
  product: Partial<Product>
  priority?: boolean
}) {
  const { gallery, title, slug, enableVariants } = product
  const image =
    gallery?.[0]?.image && typeof gallery[0].image !== 'string' ? gallery[0].image : null

  const itemURL = slug ? `/products/${slug}` : '#'
  const mainPrice = resolvePrice(product)
  const discountFromField =
    typeof product.discountPercentage === 'number' ? Math.round(product.discountPercentage) : 0
  const discountPercent = Math.min(Math.max(discountFromField, 0), 100)
  const hasDiscount = discountPercent > 0
  const discountedPrice =
    typeof mainPrice === 'number' && hasDiscount
      ? Math.round(mainPrice * (100 - discountPercent)) / 100
      : mainPrice

  const saveAmount =
    hasDiscount &&
    typeof mainPrice === 'number' &&
    typeof discountedPrice === 'number' &&
    mainPrice > discountedPrice
      ? Math.round((mainPrice - discountedPrice) * 100) / 100
      : undefined

  const productBadge =
    typeof product.productBadge === 'string' ? product.productBadge.trim() : undefined

  const inventory = product.inventory ?? 0
  const canAddSimple = Boolean(product.id) && !enableVariants
  const isSoldOut = !enableVariants && inventory <= 0

  return (
    <article
      className={cn(
        'relative isolate min-h-0 rounded-2xl border border-neutral-200/90 bg-white p-3 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.18)] sm:p-4 dark:border-border dark:bg-card dark:shadow-md',
      )}
    >
      {productBadge ? (
        <div className="pointer-events-none absolute right-0 top-0 z-10 aspect-square w-28 overflow-hidden sm:w-36 md:w-40">
          <div
            className="pointer-events-none absolute right-[-40%] top-[22%] flex w-[155%] items-center justify-center gap-1.5 bg-red-600 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-md"
            style={{ transform: 'rotate(45deg)', transformOrigin: 'center center' }}
          >
            <Tag aria-hidden className="size-3 shrink-0" strokeWidth={2.75} />
            <span>{productBadge}</span>
          </div>
        </div>
      ) : null}

      <div className="relative z-1 flex min-h-0 w-full flex-col gap-4 lg:flex-row lg:items-start lg:gap-5">
        <Link
          className={cn(
            'relative mx-auto shrink-0 overflow-hidden rounded-xl border border-muted/70 bg-muted/25 p-2.5',
            'aspect-square w-full max-w-[min(240px,calc(100vw-5rem))]',
            'lg:mx-0 lg:size-[136px] lg:max-w-none',
          )}
          href={itemURL}
        >
          {image ? (
            <MediaCmp
              className="relative size-full"
              fill
              imgClassName="object-contain"
              priority={priority}
              resource={image as Media}
              size={PRODUCT_CARD_IMAGE_SIZES}
            />
          ) : (
            <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
              No image
            </div>
          )}
        </Link>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col justify-between gap-3 px-0.5 sm:gap-4 lg:pr-6 lg:pl-0">
          <div className="flex min-h-0 flex-col space-y-2 text-center lg:text-left">
            <Link className="block min-h-0" href={itemURL}>
              <h3 className="line-clamp-3 text-[0.9375rem] font-bold leading-snug text-foreground underline-offset-4 hover:text-primary hover:underline sm:text-base sm:leading-snug">
                {title}
              </h3>
            </Link>

            <div className="flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1 lg:justify-start">
              {typeof discountedPrice === 'number' ? (
                <Price
                  amount={discountedPrice}
                  as="span"
                  className="text-base font-bold tabular-nums text-primary sm:text-lg"
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

            {typeof saveAmount === 'number' && saveAmount > 0 ? (
              <div className="inline-flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-xs font-semibold text-foreground">
                  Save
                  <Price amount={saveAmount} as="span" className="font-semibold text-foreground" />
                </span>
              </div>
            ) : null}
          </div>

          <TopSellingProductActions
            canAddSimple={canAddSimple}
            enableVariants={enableVariants}
            isSoldOut={isSoldOut}
            itemURL={itemURL}
            productId={product.id}
          />
        </div>
      </div>
    </article>
  )
}
