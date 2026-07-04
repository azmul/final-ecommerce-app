import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import React from 'react'

import { cn } from '@/utilities/cn'

type Props = {
  categoryTitle?: string
  categorySlug?: string
  subcategorySlug?: string
  subcategoryTitle?: string
  className?: string
}

function humanizeSlug(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export function ShopBreadcrumb({
  categoryTitle,
  categorySlug,
  subcategorySlug,
  subcategoryTitle,
  className,
}: Props) {
  const subSlug = subcategorySlug?.trim() || undefined
  const subLabel = subcategoryTitle || (subSlug ? humanizeSlug(subSlug) : undefined)
  const showSubcategory = Boolean(subSlug && categoryTitle)
  const categoryHref =
    categorySlug ? `/shop/${categorySlug}` : undefined

  return (
    <nav aria-label="Breadcrumb" className={cn('text-sm text-muted-foreground', className)}>
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link className="transition-colors hover:text-foreground" href="/">
            Home
          </Link>
        </li>
        <li aria-hidden>
          <ChevronRight className="size-3.5" />
        </li>
        {categoryTitle ?
          <>
            <li>
              <Link className="transition-colors hover:text-foreground" href="/shop">
                Shop
              </Link>
            </li>
            <li aria-hidden>
              <ChevronRight className="size-3.5" />
            </li>
            {showSubcategory ?
              <>
                <li>
                  {categoryHref ?
                    <Link
                      className="transition-colors hover:text-foreground"
                      href={categoryHref}
                    >
                      {categoryTitle}
                    </Link>
                  : <span>{categoryTitle}</span>}
                </li>
                <li aria-hidden>
                  <ChevronRight className="size-3.5" />
                </li>
                <li>
                  <span aria-current="page" className="font-medium text-foreground">
                    {subLabel}
                  </span>
                </li>
              </>
            : <li>
                <span aria-current="page" className="font-medium text-foreground">
                  {categoryTitle}
                </span>
              </li>
            }
          </>
        : <li>
            <span aria-current="page" className="font-medium text-foreground">
              Shop
            </span>
          </li>
        }
      </ol>
    </nav>
  )
}
