'use client'

import type { Brand, Product } from '@/payload-types'
import Link from 'next/link'
import { Suspense, useId } from 'react'

import { AddToCart } from '@/components/Cart/AddToCart'
import { CompareCheckbox } from '@/components/compare/CompareCheckbox'
import { Media } from '@/components/Media'
import { ProductAlertRow } from '@/components/notifications/ProductAlertRow'
import { StockIndicator } from '@/components/product/StockIndicator'
import { VariantSelector } from '@/components/product/VariantSelector'
import { SocialShareRow } from '@/components/SocialShare/SocialShareRow'
import { WishlistButton } from '@/components/WishlistButton'
import { brandLogoDisplayDimensions } from '@/utilities/brandLogoDisplayDimensions'
import { cn } from '@/utilities/cn'
import { getServerSideURL, toAbsoluteUrl } from '@/utilities/getURL'

/** Interactive purchase UI only — product copy is server-rendered in ProductOverview. */
export function ProductPurchasePanel({ product }: { product: Product }) {
  const brandLabelId = useId()
  const hasVariants = product.enableVariants && Boolean(product.variants?.docs?.length)

  const brandDoc = resolveProductBrand(product)
  const brandImage =
    brandDoc?.image && typeof brandDoc.image === 'object' ? brandDoc.image : null
  const brandHref =
    brandDoc?.slug && typeof brandDoc.slug === 'string' && brandDoc.slug.trim().length > 0 ?
      `/brand/${brandDoc.slug.trim()}`
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
      {brandImage ?
        <Media
          className="relative block shrink-0"
          {...brandLogoDisplayDimensions(brandImage, 44, 176)}
          imgClassName="object-contain object-left"
          resource={brandImage}
        />
      : brandDoc?.title ?
        <span className="text-base font-semibold text-foreground">{brandDoc.title}</span>
      : null}
    </>
  )

  const brandCard =
    brandDoc && (brandImage || brandDoc.title) ?
      brandHref ?
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
      : <div aria-labelledby={brandLabelId} className={brandCardClassName} role="group">
          {brandCardInner}
        </div>

    : null

  const seo = (product as Product & { seoContent?: { aiSummary?: string | null } }).seoContent

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-col gap-6 sm:gap-8" id="purchase">
      <SocialShareRow
        imageUrl={resolveProductShareImageUrl(product)}
        summary={
          seo?.aiSummary?.trim() ||
          (typeof product.meta?.description === 'string' && product.meta.description.trim()) ||
          `Shop ${product.title} online.`
        }
        title={product.title}
        url={`${getServerSideURL()}/products/${product.slug}`}
      />

      {hasVariants ?
        <Suspense fallback={null}>
          <VariantSelector product={product} />
        </Suspense>
      : null}

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
  return first && typeof first === 'object' && typeof first.url === 'string' ?
      toAbsoluteUrl(first.url)
    : undefined
}
