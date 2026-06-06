import type { Category, Product } from '@/payload-types'
import Link from 'next/link'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'

import { cn } from '@/utilities/cn'

type ProductBreadcrumbProps = {
  className?: string
  product: Product
}

export function ProductBreadcrumb({ className, product }: ProductBreadcrumbProps) {
  const categories =
    product.categories?.filter((category): category is Category => typeof category === 'object') ??
    []
  const primaryCategory = categories[0]

  return (
    <nav aria-label="Breadcrumb" className={cn('px-0', className)}>
      <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        <li>
          <Link
            className="inline-flex min-h-10 items-center gap-1 rounded-md px-2 font-medium transition-colors hover:text-foreground [-webkit-tap-highlight-color:transparent] sm:min-h-0 sm:-ms-1"
            href="/shop"
          >
            <ChevronLeftIcon aria-hidden className="size-4 shrink-0 sm:hidden" />
            <span>All products</span>
          </Link>
        </li>

        {primaryCategory?.slug && primaryCategory.title ?
          <>
            <li aria-hidden className="text-border">
              <ChevronRightIcon className="size-3.5" />
            </li>
            <li>
              <Link
                className="rounded-md px-1 font-medium transition-colors hover:text-foreground"
                href={`/shop/${primaryCategory.slug}`}
              >
                {primaryCategory.title}
              </Link>
            </li>
          </>
        : null}
      </ol>
    </nav>
  )
}
