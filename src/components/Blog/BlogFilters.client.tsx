'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/utilities/cn'
import { createUrl } from '@/utilities/createUrl'
import { SearchIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import React from 'react'

const QUERY_PUBLISHED_FROM = 'publishedFrom'
const QUERY_PUBLISHED_TO = 'publishedTo'

type Props = {
  className?: string
}

const inputCls =
  'h-9 rounded-md border border-input bg-background px-2.5 text-xs text-foreground tabular-nums placeholder:text-muted-foreground focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:text-[13px]'

export const BlogFilters: React.FC<Props> = ({ className }) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const hasFilters =
    Boolean(searchParams.get('q')?.trim()) ||
    Boolean(searchParams.get(QUERY_PUBLISHED_FROM)) ||
    Boolean(searchParams.get(QUERY_PUBLISHED_TO))

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const searchInput = form.search as HTMLInputElement
    const fromInput = form.publishedFrom as HTMLInputElement
    const toInput = form.publishedTo as HTMLInputElement

    const newParams = new URLSearchParams(searchParams.toString())
    newParams.delete('page')
    const nextQ = searchInput.value.trim()
    const nextFrom = fromInput.value.trim()
    const nextTo = toInput.value.trim()

    if (nextQ) {
      newParams.set('q', nextQ)
    } else {
      newParams.delete('q')
    }

    if (nextFrom) {
      newParams.set(QUERY_PUBLISHED_FROM, nextFrom)
    } else {
      newParams.delete(QUERY_PUBLISHED_FROM)
    }

    if (nextTo) {
      newParams.set(QUERY_PUBLISHED_TO, nextTo)
    } else {
      newParams.delete(QUERY_PUBLISHED_TO)
    }

    router.push(createUrl(pathname, newParams))
  }

  return (
    <form
      key={searchParams.toString()}
      aria-label="Filter blog articles"
      className={cn(
        'flex flex-col gap-2 rounded-lg border border-border/60 bg-muted/15 px-2 py-1.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2 sm:gap-y-2',
        className,
      )}
      onSubmit={onSubmit}
    >
      <div className="relative min-w-0 flex-1 sm:min-w-[min(280px,calc(100%-12rem))] sm:max-w-md">
        <label className="sr-only" htmlFor="blog-search">
          Search articles
        </label>
        <SearchIcon
          aria-hidden
          className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        />
        <input
          autoComplete="off"
          className={cn(inputCls, 'w-full py-2 pl-8 pr-2')}
          defaultValue={searchParams.get('q')?.trim() || ''}
          enterKeyHint="search"
          id="blog-search"
          name="search"
          placeholder="Search…"
          type="search"
        />
      </div>
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:flex-initial">
          <label className="sr-only" htmlFor="blog-published-from">
            Published from
          </label>
          <input
            aria-label="Published from date"
            className={inputCls}
            defaultValue={searchParams.get(QUERY_PUBLISHED_FROM) ?? ''}
            id="blog-published-from"
            name="publishedFrom"
            type="date"
          />
          <span className="shrink-0 text-xs text-muted-foreground" aria-hidden>
            –
          </span>
          <label className="sr-only" htmlFor="blog-published-to">
            Published until
          </label>
          <input
            aria-label="Published until date"
            className={inputCls}
            defaultValue={searchParams.get(QUERY_PUBLISHED_TO) ?? ''}
            id="blog-published-to"
            name="publishedTo"
            type="date"
          />
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-1.5">
          <Button className="h-9 shrink-0 px-3 text-xs font-medium sm:min-w-19" type="submit" variant="default">
            Apply
          </Button>
          {hasFilters ?
            <Button asChild className="h-9 shrink-0 px-2.5 text-xs text-muted-foreground" variant="ghost">
              <Link href={pathname}>Clear</Link>
            </Button>
          : null}
        </div>
      </div>
    </form>
  )
}
