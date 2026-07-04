import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import React from 'react'

import { cn } from '@/utilities/cn'

type Props = {
  className?: string
  title: string
}

export function BlogBreadcrumb({ className, title }: Props) {
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
          <Link className="transition-colors hover:text-foreground" href="/blog">
            Blog
          </Link>
        </li>
        <li aria-hidden>
          <ChevronRight className="size-3.5" />
        </li>
        <li>
          <span aria-current="page" className="font-medium text-foreground">
            {title}
          </span>
        </li>
      </ol>
    </nav>
  )
}
