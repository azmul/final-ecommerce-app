import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import React from 'react'

import { cn } from '@/utilities/cn'

type Props = {
  categoryTitle?: string
  className?: string
}

export function ShopBreadcrumb({ categoryTitle, className }: Props) {
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
            <li>
              <span className="font-medium text-foreground">{categoryTitle}</span>
            </li>
          </>
        : <li>
            <span className="font-medium text-foreground">Shop</span>
          </li>
        }
      </ol>
    </nav>
  )
}
