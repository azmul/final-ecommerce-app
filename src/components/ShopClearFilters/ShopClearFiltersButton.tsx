'use client'

import { parseShopView, shopUrlHasFilterParams } from '@/lib/search/parseShopSearchParams'
import { shopClearFiltersButtonClass } from '@/components/shop/shopFilterStyles'
import { cn } from '@/utilities/cn'
import { X } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import React from 'react'

type ShopClearFiltersProps = {
  onNavigate?: () => void
  variant?: 'sidebar' | 'inline'
}

/** Clears shop query filters on the current listing path. */
export function ShopClearFilters({ onNavigate, variant = 'sidebar' }: ShopClearFiltersProps) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  const view = parseShopView(searchParams.get('view'))
  const hasFilters = shopUrlHasFilterParams(searchParams)

  if (!hasFilters) return null

  return (
    <button
      aria-label="Clear all filters"
      className={cn(
        shopClearFiltersButtonClass,
        variant === 'sidebar' && 'w-full px-4 py-3',
        variant === 'inline' && 'shrink-0 whitespace-nowrap px-4 py-2',
      )}
      type="button"
      onClick={() => {
        const params = new URLSearchParams()
        if (view) params.set('view', view)
        const qs = params.toString()
        router.push(qs ? `${pathname}?${qs}` : pathname)
        onNavigate?.()
      }}
    >
      <X aria-hidden className="h-4 w-4 shrink-0" strokeWidth={2.5} />
      Clear All Filters
    </button>
  )
}
