'use client'

import { cn } from '@/utilities/cn'
import { createUrl } from '@/utilities/createUrl'
import { SearchIcon } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import React from 'react'

type Props = {
  className?: string
}

export const Search: React.FC<Props> = ({ className }) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const val = e.target as HTMLFormElement
    const search = val.search as HTMLInputElement
    const newParams = new URLSearchParams(searchParams.toString())

    if (search.value) {
      newParams.set('q', search.value)
    } else {
      newParams.delete('q')
    }

    router.push(createUrl(pathname, newParams))
  }

  return (
    <form className={cn('relative w-full', className)} onSubmit={onSubmit}>
      <label className="sr-only" htmlFor="shop-search">
        Search products
      </label>
      <input
        autoComplete="off"
        className="w-full rounded-xl border border-input bg-background py-3 pl-4 pr-12 text-base text-foreground shadow-sm placeholder:text-muted-foreground transition-[box-shadow,border-color] focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:py-2.5 sm:text-sm"
        defaultValue={searchParams?.get('q') || ''}
        id="shop-search"
        key={searchParams.toString()}
        name="search"
        placeholder="Search for products..."
        type="search"
        enterKeyHint="search"
      />
      <div className="pointer-events-none absolute right-0 top-0 flex h-full items-center pr-3 text-muted-foreground">
        <SearchIcon aria-hidden className="h-5 w-5 sm:h-4 sm:w-4" />
      </div>
    </form>
  )
}
