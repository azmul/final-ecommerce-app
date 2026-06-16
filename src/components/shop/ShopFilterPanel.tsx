'use client'

import type { ShopBadgeFacet, ShopBrandFacet, ShopPriceBounds } from '@/lib/search/shopFilterFacets'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ShopClearFilters } from '@/components/ShopClearFilters/ShopClearFiltersButton'
import { ShopPriceRangeSlider } from '@/components/shop/ShopPriceRangeSlider'
import { useShopFilterParams } from '@/components/shop/useShopFilterParams'
import { cn } from '@/utilities/cn'
import { Minus } from 'lucide-react'
import React, { useCallback, useMemo } from 'react'

type Props = {
  badges: ShopBadgeFacet[]
  brands: ShopBrandFacet[]
  className?: string
  onNavigate?: () => void
  priceBounds: ShopPriceBounds
}

function FilterSection({
  children,
  defaultOpen = true,
  title,
}: {
  children: React.ReactNode
  defaultOpen?: boolean
  title: string
}) {
  const [open, setOpen] = React.useState(defaultOpen)

  return (
    <section className="rounded-xl border border-border bg-card shadow-sm">
      <button
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
        onClick={() => setOpen((prev) => !prev)}
        type="button"
      >
        <div className="min-w-0">
          <span className="text-xs font-bold uppercase tracking-wide text-foreground">{title}</span>
          <span aria-hidden className="mt-1 block h-0.5 w-8 rounded-full bg-[#d4a017]" />
        </div>
        <Minus
          aria-hidden
          className={cn('size-4 shrink-0 text-muted-foreground transition-transform', {
            'rotate-90': !open,
          })}
        />
      </button>
      {open ? <div className="space-y-3 border-t border-border/70 px-4 py-4">{children}</div> : null}
    </section>
  )
}

function CountBadge({ count, tone = 'blue' }: { count: number; tone?: 'blue' | 'orange' }) {
  return (
    <span
      className={cn(
        'inline-flex min-w-7 items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums',
        tone === 'blue' ? 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300'
        : 'bg-primary/15 text-primary',
      )}
    >
      {count}
    </span>
  )
}

export function ShopFilterPanel({ badges, brands, className, onNavigate, priceBounds }: Props) {
  const {
    badge,
    brand,
    hasActiveFilters,
    inStock,
    isPending,
    maxPrice,
    minPrice,
    pushParams,
  } = useShopFilterParams(onNavigate)

  const boundsMin = priceBounds.min
  const boundsMax = Math.max(priceBounds.max, boundsMin + 1)

  const activeMin = minPrice ?? boundsMin
  const activeMax = maxPrice ?? boundsMax

  const sliderMin = useMemo(
    () => Math.min(Math.max(activeMin, boundsMin), boundsMax),
    [activeMax, activeMin, boundsMax, boundsMin],
  )
  const sliderMax = useMemo(
    () => Math.max(Math.min(activeMax, boundsMax), boundsMin),
    [activeMax, activeMin, boundsMax, boundsMin],
  )

  const handlePriceCommit = useCallback(
    (nextMin: number, nextMax: number) => {
      const atBounds = nextMin <= boundsMin && nextMax >= boundsMax
      pushParams({
        minPrice: atBounds || nextMin <= boundsMin ? null : String(nextMin),
        maxPrice: atBounds || nextMax >= boundsMax ? null : String(nextMax),
      })
    },
    [boundsMax, boundsMin, pushParams],
  )

  return (
    <div
      aria-busy={isPending}
      className={cn('flex flex-col gap-4', className)}
    >
      {hasActiveFilters ? (
        <ShopClearFilters onNavigate={onNavigate} variant="sidebar" />
      ) : null}

      <FilterSection title="Price Range">
        <ShopPriceRangeSlider
          max={boundsMax}
          min={boundsMin}
          onCommit={handlePriceCommit}
          valueMax={sliderMax}
          valueMin={sliderMin}
        />
      </FilterSection>

      {brands.length > 0 ? (
        <FilterSection title="Brands">
          <ul className="space-y-3">
            {brands.map((item) => {
              const checked = brand === item.slug
              const inputId = `shop-brand-${item.slug}`

              return (
                <li key={item.id}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-center gap-2.5">
                      <Checkbox
                        checked={checked}
                        id={inputId}
                        onCheckedChange={(next) => {
                          pushParams({ brand: next === true ? item.slug : null })
                        }}
                      />
                      <Label className="cursor-pointer truncate text-sm font-normal" htmlFor={inputId}>
                        {item.title}
                      </Label>
                    </div>
                    <CountBadge count={item.count} />
                  </div>
                </li>
              )
            })}
          </ul>
        </FilterSection>
      ) : null}

      {badges.length > 0 ? (
        <FilterSection title="Product Flag">
          <ul className="space-y-3">
            {badges.map((item) => {
              const checked = badge === item.label
              const inputId = `shop-badge-${item.label.replace(/\s+/g, '-')}`

              return (
                <li key={item.label}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-center gap-2.5">
                      <Checkbox
                        checked={checked}
                        id={inputId}
                        onCheckedChange={(next) => {
                          pushParams({ badge: next === true ? item.label : null })
                        }}
                      />
                      <Label className="cursor-pointer truncate text-sm font-normal" htmlFor={inputId}>
                        {item.label}
                      </Label>
                    </div>
                    <CountBadge count={item.count} tone="orange" />
                  </div>
                </li>
              )
            })}
          </ul>
        </FilterSection>
      ) : null}

      <FilterSection title="Availability">
        <div className="flex items-center gap-2.5">
          <Checkbox
            checked={inStock}
            id="shop-in-stock-filter"
            onCheckedChange={(next) => {
              pushParams({ inStock: next === true ? '1' : null })
            }}
          />
          <Label className="cursor-pointer text-sm font-normal" htmlFor="shop-in-stock-filter">
            In stock only
          </Label>
        </div>
      </FilterSection>
    </div>
  )
}
