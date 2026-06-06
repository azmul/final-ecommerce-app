import type { Product } from '@/payload-types'
import Link from 'next/link'
import { Suspense } from 'react'
import { Star } from 'lucide-react'

import { ProductPriceDisplay } from '@/components/product/ProductPriceDisplay'
import { RichText } from '@/components/RichText'
import { cn } from '@/utilities/cn'

function productSpecs(product: Product) {
  const seen = new Set<string>()

  return (
    product.technicalSpecs?.filter((row) => {
      if (
        typeof row?.label !== 'string' ||
        !row.label.trim() ||
        typeof row?.value !== 'string' ||
        !row.value.trim()
      ) {
        return false
      }

      const key = row.label.trim().toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    }) ?? []
  )
}

/** Title, price, and review summary — aligned with the gallery in the product hero. */
export function ProductTitleBlock({ product }: { product: Product }) {
  const hasReviews =
    typeof product.reviewAverageRating === 'number' &&
    !Number.isNaN(product.reviewAverageRating) &&
    typeof product.reviewCount === 'number' &&
    product.reviewCount > 0

  return (
    <div className="min-w-0 space-y-3">
      <h1 className="min-w-0 text-pretty text-2xl font-semibold leading-[1.15] tracking-tight text-foreground sm:text-3xl lg:max-w-[min(100%,36rem)] lg:text-4xl">
        {product.title}
      </h1>

      <div className="flex flex-wrap items-end gap-x-3 gap-y-2">
        <Suspense fallback={<div className="h-9 w-36 animate-pulse rounded-lg bg-muted/50" aria-hidden />}>
          <ProductPriceDisplay product={product} size="large" />
        </Suspense>

        {hasReviews ?
          <Link
            className={cn(
              'inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border/70 bg-muted/30 px-3 py-1.5',
              'text-sm font-medium text-foreground transition-colors hover:bg-muted/50',
            )}
            href="#product-reviews"
          >
            <Star aria-hidden className="size-3.5 fill-amber-400 text-amber-400" />
            {product.reviewAverageRating!.toFixed(1)}
            <span className="text-muted-foreground">
              ({product.reviewCount} {product.reviewCount === 1 ? 'review' : 'reviews'})
            </span>
          </Link>
        : typeof product.reviewCount === 'number' && product.reviewCount === 0 ?
          <Link
            className="inline-flex min-h-9 items-center rounded-full border border-dashed border-primary/35 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/5"
            href="#product-reviews"
          >
            Be the first to review
          </Link>
        : null}
      </div>
    </div>
  )
}

type ProductOverviewDetailsProps = {
  inTab?: boolean
  product: Product
}

/** Description and specs — hero (below purchase) or full Details tab. */
export function ProductOverviewDetails({ inTab = false, product }: ProductOverviewDetailsProps) {
  const specs = productSpecs(product)

  if (!product.description && specs.length === 0) {
    return null
  }

  return (
    <div
      className={cn(
        'min-w-0 space-y-4 sm:space-y-5',
        !inTab && 'border-t border-border/60 pt-5 lg:border-0 lg:pt-0',
      )}
    >
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
              {specs.map((row, index) => (
                <tr className="border-b border-border/60" key={`${row!.label}-${index}`}>
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
