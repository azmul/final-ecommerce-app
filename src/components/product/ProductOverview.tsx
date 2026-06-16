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

  const categories =
    product.categories?.filter(
      (category): category is any => typeof category === 'object' && category !== null,
    ) ?? []
  const primaryCategory = categories[0]

  return (
    <div className="min-w-0 space-y-4">
      {primaryCategory?.title ? (
        <span className="inline-flex w-fit items-center rounded-full bg-primary/10 dark:bg-primary/25 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-primary">
          {primaryCategory.title}
        </span>
      ) : null}

      <h1 className="min-w-0 text-pretty text-2xl font-bold leading-snug tracking-tight text-foreground sm:text-3xl lg:max-w-[min(100%,36rem)]">
        {product.title}
      </h1>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Suspense fallback={<div className="h-9 w-36 animate-pulse rounded-lg bg-muted/50" aria-hidden />}>
          <ProductPriceDisplay product={product} size="large" />
        </Suspense>

        {hasReviews ?
          <Link
            className={cn(
              'inline-flex min-h-8 items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 dark:bg-amber-500/20 px-3 py-1',
              'text-xs font-semibold text-amber-800 dark:text-amber-300 transition-all hover:bg-amber-500/15 active:scale-[0.97]',
            )}
            href="#product-reviews"
          >
            <Star aria-hidden className="size-3.5 fill-amber-400 text-amber-400" />
            <span>{product.reviewAverageRating!.toFixed(1)}</span>
            <span className="text-amber-700/80 dark:text-amber-400/80">
              ({product.reviewCount} {product.reviewCount === 1 ? 'review' : 'reviews'})
            </span>
          </Link>
        : typeof product.reviewCount === 'number' && product.reviewCount === 0 ?
          <Link
            className={cn(
              'inline-flex min-h-8 items-center gap-1.5 rounded-full border border-dashed border-primary/35 px-3 py-1',
              'text-xs font-semibold text-primary hover:bg-primary/5 active:scale-[0.97] transition-all',
            )}
            href="#product-reviews"
          >
            <Star aria-hidden className="size-3.5 text-primary/60" />
            <span>Be the first to review</span>
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
