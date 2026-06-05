import type { Product } from '@/payload-types'
import Link from 'next/link'
import { Suspense } from 'react'

import { ProductPriceDisplay } from '@/components/product/ProductPriceDisplay'
import { RichText } from '@/components/RichText'

function productSpecs(product: Product) {
  return product.technicalSpecs?.filter(
    (row) =>
      typeof row?.label === 'string' &&
      row.label.trim() &&
      typeof row?.value === 'string' &&
      row.value.trim(),
  )
}

/** Title, price, and review summary — aligned with the gallery in the product hero. */
export function ProductTitleBlock({ product }: { product: Product }) {
  return (
    <div className="min-w-0 space-y-2 sm:space-y-2.5">
      <h1 className="min-w-0 text-pretty wrap-break-word text-xl font-semibold leading-tight tracking-tight text-foreground sm:text-2xl md:text-3xl lg:max-w-[min(100%,36rem)] lg:text-4xl">
        {product.title}
      </h1>
      <Suspense fallback={<div className="h-8 w-32 animate-pulse rounded-lg bg-muted/50" aria-hidden />}>
        <ProductPriceDisplay product={product} size="large" />
      </Suspense>

      {typeof product.reviewAverageRating === 'number' &&
      !Number.isNaN(product.reviewAverageRating) &&
      typeof product.reviewCount === 'number' &&
      product.reviewCount > 0 ?
        <p className="text-sm text-muted-foreground">
          <Link
            className="font-medium text-foreground underline-offset-4 hover:underline"
            href="#product-reviews"
          >
            {product.reviewAverageRating.toFixed(1)} out of 5
          </Link>
          {' '}
          ({product.reviewCount} {product.reviewCount === 1 ? 'review' : 'reviews'})
        </p>
      : typeof product.reviewCount === 'number' && product.reviewCount === 0 ?
        <p className="text-sm text-muted-foreground">
          <Link className="font-medium text-primary underline-offset-4 hover:underline" href="#product-reviews">
            Ratings &amp; reviews
          </Link>
          {' '}
          — none yet.
        </p>
      : null}
    </div>
  )
}

/** Description and specs shown below the purchase panel. */
export function ProductOverviewDetails({ product }: { product: Product }) {
  const specs = productSpecs(product)

  if (!product.description && (!specs || specs.length === 0)) {
    return null
  }

  return (
    <div className="min-w-0 space-y-4 sm:space-y-5">
      {product.description ?
        <div className="prose prose-sm max-w-none overflow-x-auto text-muted-foreground dark:prose-invert sm:prose-base prose-p:leading-relaxed prose-img:max-w-full prose-pre:overflow-x-auto prose-headings:font-semibold">
          <RichText data={product.description} enableGutter={false} />
        </div>
      : null}

      {specs && specs.length > 0 ?
        <section aria-labelledby="product-specs-heading">
          <h2
            className="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
            id="product-specs-heading"
          >
            Specifications
          </h2>
          <table className="mt-2 w-full text-sm">
            <tbody>
              {specs.map((row) => (
                <tr className="border-b border-border/60" key={row!.label!}>
                  <th className="py-2 pe-4 text-start font-medium text-foreground" scope="row">
                    {row!.label}
                  </th>
                  <td className="py-2 text-muted-foreground">{row!.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      : null}
    </div>
  )
}

/** Server-rendered product copy for SEO, GEO, and AI crawlers (no client JS). */
export function ProductOverview({ product }: { product: Product }) {
  return (
    <div className="min-w-0 space-y-4 sm:space-y-5">
      <ProductTitleBlock product={product} />
      <ProductOverviewDetails product={product} />
    </div>
  )
}
