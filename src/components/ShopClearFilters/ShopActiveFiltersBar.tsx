'use client'

import React from 'react'
import { ShopClearFilters } from './ShopClearFiltersButton'

export function ShopActiveFiltersBar({
  hasChips,
  children,
}: {
  hasChips: boolean
  children: React.ReactNode
}) {
  if (!hasChips) return null

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 text-sm">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        <span className="shrink-0 text-muted-foreground">Active filters:</span>
        {children}
      </div>
      <ShopClearFilters variant="inline" />
    </div>
  )
}
