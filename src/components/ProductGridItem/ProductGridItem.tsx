import type { Product } from '@/payload-types'

import { Media } from '@/components/Media'
import { Price } from '@/components/Price'
import { ProductGridItemActions } from '@/components/ProductGridItem/ProductGridItemActions'
import { WishlistButton } from '@/components/WishlistButton'
import { PRODUCT_CARD_IMAGE_SIZES } from '@/lib/seo/imageSizes'
import Link from 'next/link'
import React from 'react'
import clsx from 'clsx'

type Props = {
  product: Partial<Product>
  priority?: boolean
}

function resolvePricing(product: Partial<Product>) {
  let price = product.priceInBDT
  const variants = product.variants?.docs

  if (variants && variants.length > 0) {
    const variant = variants[0]
    if (
      variant &&
      typeof variant === 'object' &&
      variant?.priceInBDT &&
      typeof variant.priceInBDT === 'number'
    ) {
      price = variant.priceInBDT
    }
  }

  const mainPrice = typeof price === 'number' ? price : undefined
  const discountFromField =
    typeof product.discountPercentage === 'number' ? Math.round(product.discountPercentage) : 0
  const discountPercent = Math.min(Math.max(discountFromField, 0), 100)
  const hasDiscount = discountPercent > 0
  const discountedPrice =
    typeof mainPrice === 'number' && hasDiscount
      ? Math.round(mainPrice * (100 - discountPercent)) / 100
      : mainPrice

  return { discountedPrice, discountPercent, hasDiscount, mainPrice }
}

export function ProductGridItem({ product, priority = false }: Props) {
  const { gallery, title } = product
  const image =
    gallery?.[0]?.image && typeof gallery[0]?.image !== 'string' ? gallery[0]?.image : false

  const itemURL = product.slug ? `/products/${product.slug}` : '#'
  const { discountedPrice, discountPercent, hasDiscount, mainPrice } = resolvePricing(product)
  const productBadge =
    typeof product.productBadge === 'string' ? product.productBadge.trim() : undefined
  const inventory = product.inventory ?? 0
  const isSoldOut = !product.enableVariants && inventory <= 0

  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-sm transition-[box-shadow,transform,border-color] hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md">
      <div className="relative flex flex-1 flex-col p-3 sm:p-4">
        <div className="pointer-events-none absolute left-3 top-3 z-10 flex max-w-[calc(100%-4rem)] flex-wrap gap-2 sm:left-4 sm:top-4">
          {productBadge ? (
            <span className="pointer-events-none rounded-md bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground shadow-sm sm:px-3 sm:text-sm">
              {productBadge}
            </span>
          ) : null}
        </div>

        <WishlistButton
          className="absolute right-3 top-3 z-20 size-10 shrink-0 shadow-md ring-1 ring-border/60 sm:right-4 sm:top-4"
          product={product}
        />

        <Link
          className="group flex min-h-0 flex-1 flex-col outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-xl"
          href={itemURL}
        >
          <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-muted/35 ring-1 ring-border/40 dark:bg-muted/25">
            {image ? (
              <Media
                className="relative h-full w-full"
                fill
                imgClassName={clsx('object-contain transition duration-300 ease-in-out', {
                  'group-hover:scale-105': true,
                })}
                priority={priority}
                resource={image}
                size={PRODUCT_CARD_IMAGE_SIZES}
              />
            ) : null}
          </div>

          <div className="mt-3 flex flex-1 flex-col gap-2 sm:mt-4 sm:gap-3">
            <h2 className="line-clamp-2 text-base font-semibold leading-snug text-foreground transition group-hover:text-primary sm:text-lg">
              {title}
            </h2>

            <div className="inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              {typeof discountedPrice === 'number' ? (
                <Price
                  amount={discountedPrice}
                  as="span"
                  className="text-base font-bold text-primary sm:text-lg"
                />
              ) : null}

              {hasDiscount && typeof mainPrice === 'number' ? (
                <Price
                  amount={mainPrice}
                  as="span"
                  className="text-xs font-medium text-muted-foreground line-through sm:text-sm"
                />
              ) : null}

              {hasDiscount ? (
                <span className="text-[11px] font-bold uppercase tracking-wide text-primary sm:text-xs">
                  Save {discountPercent}%
                </span>
              ) : null}
            </div>
          </div>
        </Link>

        <ProductGridItemActions
          inventory={inventory}
          isSoldOut={isSoldOut}
          itemURL={itemURL}
          product={product}
        />
      </div>
    </article>
  )
}
