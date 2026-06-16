'use client'

import type { ShopBadgeFacet, ShopBrandFacet, ShopPriceBounds } from '@/lib/search/shopFilterFacets'

import { FilterItemDropdown } from '@/components/layout/search/filter/FilterItemDropdown'
import { ShopFilterPanel } from '@/components/shop/ShopFilterPanel'
import { useShopFilterParams } from '@/components/shop/useShopFilterParams'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { sorting } from '@/lib/constants'
import { shopViewOptions } from '@/lib/search/shopGridView'
import { cn } from '@/utilities/cn'
import { ChevronDown, ListFilter } from 'lucide-react'
import React, { Suspense, useEffect, useRef, useState } from 'react'

type Props = {
  badges: ShopBadgeFacet[]
  brands: ShopBrandFacet[]
  className?: string
  priceBounds: ShopPriceBounds
}

function ViewDropdown({ className }: { className?: string }) {
  const { pushParams, view } = useShopFilterParams()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const active =
    shopViewOptions.find((option) =>
      option.value === 'default' ? !view : view === option.value,
    ) ?? shopViewOptions[0]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    window.addEventListener('click', handleClickOutside)
    return () => window.removeEventListener('click', handleClickOutside)
  }, [])

  return (
    <div className={cn('relative min-w-0', className)} ref={ref}>
      <button
        aria-expanded={open}
        className="flex min-h-10 w-full items-center justify-between gap-1.5 rounded-xl border border-input bg-background px-3 py-2 text-sm font-medium text-primary"
        onClick={() => setOpen((prev) => !prev)}
        type="button"
      >
        <span className="truncate">{active.label}</span>
        <ChevronDown aria-hidden className="size-4 shrink-0" />
      </button>
      {open ?
        <div className="absolute right-0 z-40 mt-1 min-w-[8.5rem] overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          {shopViewOptions.map((option) => {
            const isActive =
              option.value === 'default' ? !view : view === option.value

            return (
              <button
                className={cn(
                  'block w-full px-4 py-2.5 text-left text-sm transition hover:bg-muted/60',
                  isActive && 'font-semibold text-primary',
                )}
                key={option.value}
                onClick={() => {
                  pushParams({
                    view: option.value === 'default' ? null : option.value,
                  })
                  setOpen(false)
                }}
                type="button"
              >
                {option.label}
              </button>
            )
          })}
        </div>
      : null}
    </div>
  )
}

function MobileFiltersSheet({
  badges,
  brands,
  priceBounds,
}: Pick<Props, 'badges' | 'brands' | 'priceBounds'>) {
  const [filtersOpen, setFiltersOpen] = useState(false)

  return (
    <Sheet onOpenChange={setFiltersOpen} open={filtersOpen}>
      <SheetTrigger asChild>
        <button
          className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg border-2 border-primary px-3 text-sm font-bold uppercase tracking-wide text-primary transition hover:bg-primary/5"
          type="button"
        >
          <ListFilter aria-hidden className="size-4" />
          Filters
        </button>
      </SheetTrigger>
      <SheetContent
        className="w-[min(100vw-3rem,22rem)] overflow-y-auto border-r p-4 sm:max-w-md"
        overlayClassName="bg-black/50"
        side="left"
      >
        <SheetTitle className="sr-only">Shop filters</SheetTitle>
        <ShopFilterPanel
          badges={badges}
          brands={brands}
          onNavigate={() => setFiltersOpen(false)}
          priceBounds={priceBounds}
        />
      </SheetContent>
    </Sheet>
  )
}

export function ShopListingToolbar({ badges, brands, className, priceBounds }: Props) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card px-3 py-3 shadow-sm sm:px-4',
        className,
      )}
    >
      <div className="grid grid-cols-[auto_minmax(0,1fr)_6.75rem] items-center gap-2 lg:hidden">
        <MobileFiltersSheet badges={badges} brands={brands} priceBounds={priceBounds} />
        <div className="min-w-0">
          <Suspense fallback={null}>
            <FilterItemDropdown list={[...sorting]} />
          </Suspense>
        </div>
        <ViewDropdown />
      </div>

      <div className="hidden items-center justify-between gap-4 lg:flex">
        <div className="flex min-w-0 items-center gap-3">
          <span className="shrink-0 text-sm text-muted-foreground">Sort By:</span>
          <div className="w-52">
            <Suspense fallback={null}>
              <FilterItemDropdown list={[...sorting]} />
            </Suspense>
          </div>
        </div>
        <ViewDropdown className="w-40" />
      </div>
    </div>
  )
}
