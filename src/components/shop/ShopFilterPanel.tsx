'use client'

import type {
  ShopBadgeFacet,
  ShopBrandFacet,
  ShopCategoryFacet,
  ShopPriceBounds,
  ShopSubcategoryFacet,
} from '@/lib/search/shopFilterFacets'
import type { ShopVariantOptionFacet } from '@/lib/search/variantOptionFacets'

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
  categories: ShopCategoryFacet[]
  categorySlug?: string
  className?: string
  onNavigate?: () => void
  priceBounds: ShopPriceBounds
  subcategories: ShopSubcategoryFacet[]
  variantOptions?: ShopVariantOptionFacet[]
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
  if (count <= 0) return null

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

function CheckboxFilterList({
  checkedSlug,
  items,
  onToggle,
  prefix,
  showCounts = true,
  tone = 'blue',
}: {
  checkedSlug: string
  items: Array<{ count?: number; id?: number | string; slug: string; title: string }>
  onToggle: (slug: string, checked: boolean) => void
  prefix: string
  showCounts?: boolean
  tone?: 'blue' | 'orange'
}) {
  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const checked = checkedSlug === item.slug
        const inputId = `${prefix}-${item.slug.replace(/\s+/g, '-')}`

        return (
          <li key={item.id ?? item.slug}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                <Checkbox
                  checked={checked}
                  id={inputId}
                  onCheckedChange={(next) => {
                    onToggle(item.slug, next === true)
                  }}
                />
                <Label className="cursor-pointer truncate text-sm font-normal" htmlFor={inputId}>
                  {item.title}
                </Label>
              </div>
              {showCounts && typeof item.count === 'number' ?
                <CountBadge count={item.count} tone={tone} />
              : null}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export function ShopFilterPanel({
  badges,
  brands,
  categories,
  categorySlug,
  className,
  onNavigate,
  priceBounds,
  subcategories,
  variantOptions = [],
}: Props) {
  const {
    badge,
    brand,
    hasActiveFilters,
    inStock,
    isPending,
    maxPrice,
    minPrice,
    navigateToCategory,
    pushParams,
    sub,
    variantOptionIds,
  } = useShopFilterParams(onNavigate)

  const catalogMin = priceBounds.min
  const catalogMax = priceBounds.max
  const boundsMin = minPrice != null ? Math.min(catalogMin, minPrice) : catalogMin
  const boundsMax = Math.max(
    maxPrice != null ? Math.max(catalogMax, maxPrice) : catalogMax,
    boundsMin + 1,
  )

  const activeMin = minPrice ?? catalogMin
  const activeMax = maxPrice ?? catalogMax

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

  const categoryFilters = subcategories.length > 0 ? subcategories : categories
  const showCategorySection = categoryFilters.length > 0

  return (
    <div aria-busy={isPending} className={cn('flex flex-col gap-4', className)}>
      {hasActiveFilters ?
        <ShopClearFilters onNavigate={onNavigate} variant="sidebar" />
      : null}

      {showCategorySection ?
        <FilterSection title="Filter by Category">
          {subcategories.length > 0 ?
            <CheckboxFilterList
              checkedSlug={sub}
              items={subcategories}
              onToggle={(slug, checked) => {
                pushParams({ sub: checked ? slug : null })
              }}
              prefix="shop-subcategory"
              showCounts={false}
            />
          : <CheckboxFilterList
              checkedSlug={categorySlug ?? ''}
              items={categories}
              onToggle={(slug, checked) => {
                navigateToCategory(checked ? slug : null)
              }}
              prefix="shop-category"
              showCounts={false}
            />
          }
        </FilterSection>
      : null}

      <FilterSection title="Price Range">
        <ShopPriceRangeSlider
          max={boundsMax}
          min={boundsMin}
          onCommit={handlePriceCommit}
          valueMax={sliderMax}
          valueMin={sliderMin}
        />
      </FilterSection>

      {brands.length > 0 ?
        <FilterSection title="Brands">
          <CheckboxFilterList
            checkedSlug={brand}
            items={brands}
            onToggle={(slug, checked) => {
              pushParams({ brand: checked ? slug : null })
            }}
            prefix="shop-brand"
          />
        </FilterSection>
      : null}

      {badges.length > 0 ?
        <FilterSection title="Product Flag">
          <CheckboxFilterList
            checkedSlug={badge}
            items={badges.map((item) => ({ ...item, slug: item.label, title: item.label }))}
            onToggle={(label, checked) => {
              pushParams({ badge: checked ? label : null })
            }}
            prefix="shop-badge"
            showCounts
            tone="orange"
          />
        </FilterSection>
      : null}

      {variantOptions.length > 0 ?
        <FilterSection title="Size / options">
          <ul className="space-y-3">
            {variantOptions.map((option) => {
              const checked = variantOptionIds.includes(option.id)
              const inputId = `shop-vopt-${option.id}`
              return (
                <li key={option.id}>
                  <div className="flex items-center gap-2.5">
                    <Checkbox
                      checked={checked}
                      id={inputId}
                      onCheckedChange={(next) => {
                        const nextIds =
                          next === true ?
                            [...variantOptionIds, option.id]
                          : variantOptionIds.filter((id) => id !== option.id)
                        pushParams({
                          vopt: nextIds.length ? nextIds.join(',') : null,
                        })
                      }}
                    />
                    <Label className="cursor-pointer text-sm font-normal" htmlFor={inputId}>
                      {option.typeLabel}: {option.label}
                    </Label>
                    <CountBadge count={option.count} />
                  </div>
                </li>
              )
            })}
          </ul>
        </FilterSection>
      : null}

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
