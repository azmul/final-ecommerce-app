import * as React from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { buttonVariants } from '@/components/ui/button'

import type { BlogListSearchParams } from '@/utilities/blogPagination'
import {
  buildBlogPageHref,
  getBlogPaginationPageNumbers,
} from '@/utilities/blogPagination'
import { cn } from '@/utilities/cn'

type Props = {
  pathname: string
  resolvedSearch: BlogListSearchParams
  currentPage: number
  totalPages: number
  className?: string
}

const disabledNavCls = cn(
  buttonVariants({ variant: 'ghost', size: 'default' }),
  'pointer-events-none inline-flex items-center opacity-35',
)

export function BlogPagination({
  pathname,
  resolvedSearch,
  currentPage,
  totalPages,
  className,
}: Props) {
  if (totalPages <= 1) return null

  const clampedTotal = Math.max(1, totalPages)
  const safeCurrent = Math.min(Math.max(1, currentPage), clampedTotal)
  const href = (page: number) => buildBlogPageHref(pathname, resolvedSearch, page)
  const pageNums = getBlogPaginationPageNumbers(safeCurrent, clampedTotal)

  return (
    <Pagination className={cn('mt-10', className)}>
      <PaginationContent className="flex-wrap justify-center gap-1 gap-y-2">
        <PaginationItem>
          {safeCurrent > 1 ?
            <PaginationPrevious href={href(safeCurrent - 1)} />
          : <span
              aria-disabled="true"
              className={cn(disabledNavCls, 'gap-1 px-2.5 sm:pl-2.5')}
            >
              <ChevronLeftIcon className="size-4 shrink-0" />
              <span className="hidden sm:inline">Previous</span>
            </span>}
        </PaginationItem>

        {pageNums.map((num, index) => {
          const prevNum = index > 0 ? pageNums[index - 1]! : 0
          const showEllipsis = num - prevNum > 1

          return (
            <React.Fragment key={`p-${num}`}>
              {showEllipsis ?
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              : null}
              <PaginationItem>
                <PaginationLink href={href(num)} isActive={num === safeCurrent}>
                  {num}
                </PaginationLink>
              </PaginationItem>
            </React.Fragment>
          )
        })}

        <PaginationItem>
          {safeCurrent < clampedTotal ?
            <PaginationNext href={href(safeCurrent + 1)} />
          : <span
              aria-disabled="true"
              className={cn(disabledNavCls, 'gap-1 px-2.5 sm:pr-2.5')}
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRightIcon className="size-4 shrink-0" />
            </span>}
        </PaginationItem>
      </PaginationContent>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        Page {safeCurrent} of {clampedTotal}
      </p>
    </Pagination>
  )
}
