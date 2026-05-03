'use client'

import { FilterItemDropdown } from '@/components/layout/search/filter/FilterItemDropdown'
import { sorting } from '@/lib/constants'
import React from 'react'

export function ShopSortBy() {
  return (
    <div className="flex w-full items-center gap-2 sm:w-auto">
      <span className="shrink-0 text-sm text-muted-foreground">Sort by</span>
      <div className="min-w-0 flex-1 sm:w-44 sm:flex-initial md:w-52">
        <FilterItemDropdown list={sorting} />
      </div>
    </div>
  )
}
