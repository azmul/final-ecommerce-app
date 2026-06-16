import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import React from 'react'

import { cn } from '@/utilities/cn'

type Props = {
  brandTitle: string
  className?: string
}

export function BrandBreadcrumb({ brandTitle, className }: Props) {
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
        <li>
          <Link className="transition-colors hover:text-foreground" href="/all-brands">
            Brands
          </Link>
        </li>
        <li aria-hidden>
          <ChevronRight className="size-3.5" />
        </li>
        <li>
          <span className="font-medium text-foreground">{brandTitle}</span>
        </li>
      </ol>
    </nav>
  )
}
