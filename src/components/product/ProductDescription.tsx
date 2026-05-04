'use client'
import type { Brand, Product, Variant } from '@/payload-types'

import { RichText } from '@/components/RichText'
import { AddToCart } from '@/components/Cart/AddToCart'
import { Price } from '@/components/Price'
import React, { Suspense, useId } from 'react'
import Link from 'next/link'

import { VariantSelector } from './VariantSelector'
import { useCurrency } from '@payloadcms/plugin-ecommerce/client/react'
import { StockIndicator } from '@/components/product/StockIndicator'
import { CompareCheckbox } from '@/components/compare/CompareCheckbox'
import { ProductAlertRow } from '@/components/notifications/ProductAlertRow'
import { WishlistButton } from '@/components/WishlistButton'
import { SocialShareRow } from '@/components/SocialShare/SocialShareRow'
import { averageToStarDisplay, StarRating } from '@/components/product/StarRating'
import { Media } from '@/components/Media'
import { brandLogoDisplayDimensions } from '@/utilities/brandLogoDisplayDimensions'
import { cn } from '@/utilities/cn'
import { getServerSideURL, toAbsoluteUrl } from '@/utilities/getURL'

export function ProductDescription({ product }: { product: Product }) {
  const { currency } = useCurrency()
  const brandLabelId = useId()
  let amount = 0,
    lowestAmount = 0,
    highestAmount = 0
  const priceField = `priceIn${currency.code}` as keyof Product
  const hasVariants = product.enableVariants && Boolean(product.variants?.docs?.length)
  const discountFromField =
    typeof product.discountPercentage === 'number' ? Math.round(product.discountPercentage) : 0
  const discountPercent = Math.min(Math.max(discountFromField, 0), 100)
  const hasDiscount = discountPercent > 0

  if (hasVariants) {
    const priceField = `priceIn${currency.code}` as keyof Variant
    const variantsOrderedByPrice = product.variants?.docs
      ?.filter((variant): variant is Variant => Boolean(variant && typeof variant === 'object'))
      .sort((a, b) => {
        if (
          typeof a === 'object' &&
          typeof b === 'object' &&
          priceField in a &&
          priceField in b &&
          typeof a[priceField] === 'number' &&
          typeof b[priceField] === 'number'
        ) {
          return a[priceField] - b[priceField]
        }

        return 0
      })

    if (variantsOrderedByPrice?.length) {
      const lowestVariant = variantsOrderedByPrice[0][priceField]
      const highestVariant = variantsOrderedByPrice[variantsOrderedByPrice.length - 1][priceField]

      if (typeof lowestVariant === 'number' && typeof highestVariant === 'number') {
        lowestAmount = lowestVariant
        highestAmount = highestVariant
      }
    }
  } else if (product[priceField] && typeof product[priceField] === 'number') {
    amount = product[priceField]
  }

  let discountedAmount = amount
  if (!hasVariants && hasDiscount && typeof amount === 'number') {
    discountedAmount = Math.round(amount * (100 - discountPercent)) / 100
  }

  let discountedLowest = lowestAmount
  let discountedHighest = highestAmount
  if (hasVariants && hasDiscount && typeof lowestAmount === 'number' && typeof highestAmount === 'number') {
    discountedLowest = Math.round(lowestAmount * (100 - discountPercent)) / 100
    discountedHighest = Math.round(highestAmount * (100 - discountPercent)) / 100
  }

  const brandDoc = resolveProductBrand(product)
  const brandImage =
    brandDoc?.image && typeof brandDoc.image === 'object' ? brandDoc.image : null
  const brandHref =
    brandDoc?.slug && typeof brandDoc.slug === 'string' && brandDoc.slug.trim().length > 0
      ? `/brand/${brandDoc.slug.trim()}`
      : null

  const brandCardClassName =
    'flex w-fit max-w-full flex-wrap items-center gap-3 self-start rounded-2xl border border-border bg-gradient-to-br from-muted/40 to-muted/10 p-3.5 shadow-sm dark:from-muted/25 dark:to-transparent sm:gap-3.5 sm:p-4'

  const brandCardInner = (
    <>
      <span
        className="text-xs font-bold uppercase tracking-wide text-muted-foreground"
        id={brandLabelId}
      >
        Brand
      </span>
      {brandImage ? (
        <Media
          className="relative block shrink-0"
          {...brandLogoDisplayDimensions(brandImage, 44, 176)}
          imgClassName="object-contain object-left"
          resource={brandImage}
        />
      ) : brandDoc?.title ? (
        <span className="text-base font-semibold text-foreground">{brandDoc.title}</span>
      ) : null}
    </>
  )

  const brandCard =
    brandDoc && (brandImage || brandDoc.title) ? (
      brandHref ? (
        <Link
          aria-labelledby={brandLabelId}
          className={cn(
            brandCardClassName,
            'outline-offset-4 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          )}
          href={brandHref}
        >
          {brandCardInner}
        </Link>
      ) : (
        <div aria-labelledby={brandLabelId} className={brandCardClassName} role="group">
          {brandCardInner}
        </div>
      )
    ) : null

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-col gap-6 sm:gap-8">
      <div className="min-w-0 space-y-3 sm:space-y-4">
        <div className="flex min-w-0 flex-col gap-4 sm:gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
          <h1 className="min-w-0 text-pretty wrap-break-word text-xl font-semibold leading-tight tracking-tight text-foreground sm:text-2xl md:text-3xl lg:max-w-[min(100%,28rem)] lg:text-4xl">
            {product.title}
          </h1>
          <div className="min-w-0 w-full shrink-0 rounded-2xl border border-border bg-muted/20 px-3 py-2.5 backdrop-blur-sm sm:w-fit sm:px-4 sm:py-3 lg:ml-auto lg:text-right dark:bg-muted/25">
            <div className="inline-flex max-w-full flex-wrap items-baseline gap-x-2 gap-y-1 font-mono lg:flex-col-reverse lg:items-end lg:gap-1">
              {hasVariants ? (
                hasDiscount ? (
                  <>
                    <Price
                      highestAmount={discountedHighest}
                      lowestAmount={discountedLowest}
                      as="span"
                      className="text-base font-semibold text-foreground sm:text-lg"
                    />
                    <div className="flex flex-wrap items-baseline gap-2 lg:justify-end">
                      <Price
                        highestAmount={highestAmount}
                        lowestAmount={lowestAmount}
                        as="span"
                        className="text-xs text-muted-foreground line-through sm:text-sm"
                      />
                      <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-xs font-bold text-primary">
                        −{discountPercent}%
                      </span>
                    </div>
                  </>
                ) : (
                  <Price
                    highestAmount={highestAmount}
                    lowestAmount={lowestAmount}
                    className="text-base font-semibold sm:text-lg"
                  />
                )
              ) : hasDiscount && typeof amount === 'number' && amount > 0 ? (
                <>
                  <div className="flex flex-wrap items-baseline gap-2 lg:justify-end">
                    <Price amount={discountedAmount} as="span" className="text-base font-semibold sm:text-lg" />
                    <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-xs font-bold text-primary">
                      −{discountPercent}%
                    </span>
                  </div>
                  <Price
                    amount={amount}
                    as="span"
                    className="text-xs text-muted-foreground line-through sm:text-sm"
                  />
                </>
              ) : (
                <Price amount={amount} className="text-base font-semibold sm:text-lg" />
              )}
            </div>
          </div>
        </div>
        {typeof product.reviewAverageRating === 'number' &&
        !Number.isNaN(product.reviewAverageRating) &&
        typeof product.reviewCount === 'number' &&
        product.reviewCount > 0 ?
          <div className="flex w-full max-w-full min-w-0 flex-wrap items-center gap-3 pt-1">
            <Link
              aria-label={`Read ${product.reviewCount} customer reviews`}
              className="inline-flex max-w-full min-w-0 touch-manipulation flex-wrap items-center gap-x-2 gap-y-2 rounded-full border border-border/70 bg-muted/25 px-3 py-2 text-sm leading-snug text-foreground shadow-sm [-webkit-tap-highlight-color:transparent] outline-none ring-offset-background transition hover:border-primary/45 hover:bg-muted/35 active:bg-muted/45 focus-visible:ring-2 focus-visible:ring-ring dark:bg-muted/20 sm:py-1.5"
              href="#product-reviews"
            >
              <StarRating
                readOnly
                label={`Average rating ${product.reviewAverageRating.toFixed(1)} out of 5 stars`}
                size="sm"
                value={averageToStarDisplay(Math.round(product.reviewAverageRating))}
              />
              <span className="font-semibold tabular-nums">{product.reviewAverageRating.toFixed(1)}</span>
              <span className="text-muted-foreground">
                ({product.reviewCount} {product.reviewCount === 1 ? 'review' : 'reviews'})
              </span>
            </Link>
          </div>
        : typeof product.reviewCount === 'number' && product.reviewCount === 0 ?
          <p className="pt-1 text-sm leading-relaxed text-muted-foreground">
            <Link className="font-medium text-primary underline-offset-4 hover:underline" href="#product-reviews">
              Ratings &amp; reviews
            </Link>
            <span aria-hidden> · </span>
            None yet—be the first to share feedback.
          </p>
        : null}
      </div>

      {product.description ? (
        <div className="prose prose-sm max-w-none overflow-x-auto text-muted-foreground dark:prose-invert sm:prose-base prose-p:leading-relaxed prose-img:max-w-full prose-pre:overflow-x-auto prose-headings:font-semibold">
          <RichText className="" data={product.description} enableGutter={false} />
        </div>
      ) : null}

      <SocialShareRow
        imageUrl={resolveProductShareImageUrl(product)}
        summary={
          (typeof product.meta?.description === 'string' && product.meta.description.trim()) ||
          `Shop ${product.title} online.`
        }
        title={product.title}
        url={`${getServerSideURL()}/products/${product.slug}`}
      />

      {hasVariants && (
        <Suspense fallback={null}>
          <VariantSelector product={product} />
        </Suspense>
      )}

      <div className="flex flex-col gap-6 border-t border-border/80 pt-6 sm:pt-8">
        <Suspense fallback={<div className="h-12 animate-pulse rounded-lg bg-muted/50" aria-hidden />}>
          <StockIndicator product={product} />
        </Suspense>
      </div>

      <div className="flex w-full max-w-full min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
        <Suspense fallback={null}>
          <AddToCart
            buttonClassName="border-primary bg-primary text-primary-foreground shadow-md transition hover:bg-primary/90 hover:text-primary-foreground"
            product={product}
          />
        </Suspense>
        <Suspense fallback={null}>
          <WishlistButton className="w-full shrink-0 justify-center sm:w-auto" product={product} showLabel />
        </Suspense>
        <CompareCheckbox productId={product.id} variant="detail" />
      </div>

      <Suspense fallback={<div className="mt-2 h-16 animate-pulse rounded-xl bg-muted/25" aria-hidden />}>
        <ProductAlertRow className="mt-2" product={product} />
      </Suspense>

      {brandCard}
    </div>
  )
}

function resolveProductBrand(product: Product): Brand | null {
  const brand = product.brand
  if (brand && typeof brand === 'object') {
    return brand
  }

  return null
}

function resolveProductShareImageUrl(product: Product): string | undefined {
  const metaImg = typeof product.meta?.image === 'object' ? product.meta.image : undefined
  if (metaImg?.url) return toAbsoluteUrl(metaImg.url)

  const first = product.gallery?.find((item) => typeof item.image === 'object')?.image
  return first && typeof first === 'object' && typeof first.url === 'string'
    ? toAbsoluteUrl(first.url)
    : undefined
}
