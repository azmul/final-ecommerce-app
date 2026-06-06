import type { Product } from '@/payload-types'
import Link from 'next/link'

import { lexicalPlainText } from '@/lib/richtext/lexicalPlainText'
import { sanitizeProductSeoText } from '@/lib/seo/sanitizeProductSeoText'
import { cn } from '@/utilities/cn'

type ProductOverviewHeroTeaserProps = {
  product: Product
}

/** Short hero copy when full details live in the Details tab. */
export function ProductOverviewHeroTeaser({ product }: ProductOverviewHeroTeaserProps) {
  const seo = (product as Product & { seoContent?: { aiSummary?: string | null; usageInfo?: string | null } })
    .seoContent

  const teaser =
    sanitizeProductSeoText(seo?.aiSummary) ||
    lexicalPlainText(product.description) ||
    sanitizeProductSeoText(seo?.usageInfo) ||
    null

  if (!teaser) return null

  return (
    <div
      className={cn(
        'min-w-0 space-y-3 border-t border-border/60 pt-5 lg:border-0 lg:pt-0',
      )}
    >
      <p className="line-clamp-3 text-pretty text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
        {teaser}
      </p>
      <Link
        className="inline-flex min-h-10 items-center text-sm font-medium text-primary underline-offset-4 hover:underline"
        href="#product-details"
      >
        Read full product details
      </Link>
    </div>
  )
}
