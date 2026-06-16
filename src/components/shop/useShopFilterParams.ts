'use client'

import {
  parseOptionalPrice,
  parseOptionalSort,
  parseShopView,
  shopUrlHasFilterParams,
} from '@/lib/search/parseShopSearchParams'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useTransition } from 'react'

export function useShopFilterParams(onNavigate?: () => void) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const brand = searchParams.get('brand')?.trim() ?? ''
  const badge = searchParams.get('badge')?.trim() ?? ''
  const inStock = searchParams.get('inStock') === '1'
  const minPrice = parseOptionalPrice(searchParams.get('minPrice'))
  const maxPrice = parseOptionalPrice(searchParams.get('maxPrice'))
  const sort = parseOptionalSort(searchParams.get('sort'))
  const sub = searchParams.get('sub')?.trim() ?? ''
  const q = searchParams.get('q')?.trim() ?? ''
  const view = parseShopView(searchParams.get('view'))

  const hasActiveFilters =
    shopUrlHasFilterParams(searchParams)

  const pushParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === '') {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      }
      const qs = params.toString()
      startTransition(() => {
        router.push(qs ? `${pathname}?${qs}` : pathname)
        onNavigate?.()
      })
    },
    [onNavigate, pathname, router, searchParams],
  )

  return {
    badge,
    brand,
    hasActiveFilters,
    inStock,
    isPending,
    maxPrice,
    minPrice,
    pushParams,
    view,
  }
}
