'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import React, { useCallback, useTransition } from 'react'

export type ShopBrandOption = {
  id: number
  slug: string
  title: string
}

type Props = {
  brands: ShopBrandOption[]
}

export function ShopProductFilters({ brands }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const brand = searchParams.get('brand') ?? ''
  const inStock = searchParams.get('inStock') === '1'
  const minPrice = searchParams.get('minPrice') ?? ''
  const maxPrice = searchParams.get('maxPrice') ?? ''

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
      })
    },
    [pathname, router, searchParams],
  )

  return (
    <div
      className="flex flex-col gap-4 rounded-xl border border-border bg-card/50 p-4 sm:flex-row sm:flex-wrap sm:items-end"
      aria-busy={isPending}
    >
      {brands.length > 0 ? (
        <div className="min-w-40 flex-1 space-y-1.5">
          <Label
            htmlFor="shop-brand-filter"
            className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
          >
            Brand
          </Label>
          <Select
            value={brand || '__all__'}
            onValueChange={(value) => {
              pushParams({ brand: value === '__all__' ? null : value })
            }}
          >
            <SelectTrigger id="shop-brand-filter" className="w-full">
              <SelectValue placeholder="All brands" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All brands</SelectItem>
              {brands.map((b) => (
                <SelectItem key={b.id} value={b.slug}>
                  {b.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <div className="flex gap-3">
        <div className="space-y-1.5">
          <Label
            htmlFor="shop-min-price"
            className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
          >
            Min (৳)
          </Label>
          <input
            id="shop-min-price"
            type="number"
            min={0}
            className="flex h-10 w-24 rounded-md border border-input bg-background px-3 py-2 text-sm"
            defaultValue={minPrice}
            onBlur={(e) => {
              pushParams({ minPrice: e.target.value.trim() || null })
            }}
          />
        </div>
        <div className="space-y-1.5">
          <Label
            htmlFor="shop-max-price"
            className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
          >
            Max (৳)
          </Label>
          <input
            id="shop-max-price"
            type="number"
            min={0}
            className="flex h-10 w-24 rounded-md border border-input bg-background px-3 py-2 text-sm"
            defaultValue={maxPrice}
            onBlur={(e) => {
              pushParams({ maxPrice: e.target.value.trim() || null })
            }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 pb-1">
        <Checkbox
          id="shop-in-stock"
          checked={inStock}
          onCheckedChange={(checked) => {
            pushParams({ inStock: checked === true ? '1' : null })
          }}
        />
        <Label htmlFor="shop-in-stock" className="cursor-pointer text-sm font-normal">
          In stock only
        </Label>
      </div>
    </div>
  )
}
