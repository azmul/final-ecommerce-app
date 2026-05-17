import type { Product } from '@/payload-types'
import Link from 'next/link'

import { RichText } from '@/components/RichText'

/** Server-rendered product copy for SEO, GEO, and AI crawlers (no client JS). */
export function ProductOverview({ product }: { product: Product }) {
  const specs = product.technicalSpecs?.filter(
    (row) =>
      typeof row?.label === 'string' &&
      row.label.trim() &&
      typeof row?.value === 'string' &&
      row.value.trim(),
  )

  return (
    <div className="min-w-0 space-y-4 sm:space-y-5">
      <div className="flex min-w-0 flex-col gap-2 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
        <h1 className="min-w-0 text-pretty wrap-break-word text-xl font-semibold leading-tight tracking-tight text-foreground sm:text-2xl md:text-3xl lg:max-w-[min(100%,28rem)] lg:text-4xl">
          {product.title}
        </h1>
        {typeof product.priceInBDT === 'number' ?
          <p className="shrink-0 font-mono text-base font-semibold text-foreground sm:text-lg lg:text-right">
            ৳{product.priceInBDT.toLocaleString('en-BD')}
            {product.enableVariants ?
              <span className="ms-1 text-sm font-normal text-muted-foreground">from</span>
            : null}
          </p>
        : null}
      </div>

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
