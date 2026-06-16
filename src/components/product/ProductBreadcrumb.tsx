import type { Category, Product } from '@/payload-types'
import Link from 'next/link'

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
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <li>
          <Link
            className="font-medium transition-colors hover:text-foreground"
            href="/"
          >
            Home
          </Link>
        </li>

        <li aria-hidden className="text-muted-foreground/70">
          &gt;
        </li>

        <li>
          <Link
            className="font-medium transition-colors hover:text-foreground"
            href="/shop"
          >
            Products
          </Link>
        </li>

        {primaryCategory?.slug && primaryCategory.title ?
          <>
            <li aria-hidden className="text-muted-foreground/70">
              &gt;
            </li>
            <li>
              <Link
                className="font-medium transition-colors hover:text-foreground"
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
