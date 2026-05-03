'use client'

import { isShopCategoryPath } from '@/utilities/shopPath'
import { X } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import React from 'react'
import { cn } from '@/utilities/cn'

const baseButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-xl border-2 border-primary bg-primary/10 text-sm font-semibold text-primary shadow-sm transition hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:text-base'

type ShopClearFiltersProps = {
  variant?: 'sidebar' | 'inline'
}

/** Clears shop search, category path, subcategory, and sort (navigates to `/shop`). */
export function ShopClearFilters({ variant = 'sidebar' }: ShopClearFiltersProps) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  const q = searchParams.get('q')?.trim()
  const sort = searchParams.get('sort')
  const categoryInPath = isShopCategoryPath(pathname)
  const show = Boolean(q || sort || categoryInPath)

  if (!show) return null

  return (
    <button
      aria-label="Clear filters"
      className={cn(
        baseButtonClass,
        variant === 'sidebar' && 'w-full py-3',
        variant === 'inline' && 'shrink-0 whitespace-nowrap px-4 py-2',
      )}
      type="button"
      onClick={() => router.push('/shop')}
    >
      <X aria-hidden className="h-4 w-4 shrink-0 sm:h-4.5 sm:w-4.5" strokeWidth={2.5} />
      Clear filters
    </button>
  )
}
