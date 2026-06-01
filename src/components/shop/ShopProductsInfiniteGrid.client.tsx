'use client'

import { Grid } from '@/components/Grid'
import { ProductGridItem } from '@/components/ProductGridItem'
import {
  SHOP_PRODUCTS_PER_PAGE,
  type ShopListingFilters,
} from '@/lib/search/shopProducts'
import type { Product } from '@/payload-types'
import React, { useCallback, useEffect, useRef, useState } from 'react'

type Props = {
  filters: ShopListingFilters
  initialHasMore: boolean
  initialProducts: Partial<Product>[]
  /** Resets grid when listing changes (e.g. `/shop` → `/shop/honey`). */
  listingKey: string
}

type FetchState = 'idle' | 'loadingMore' | 'error'

function buildSearchParams(filters: ShopListingFilters, page: number): URLSearchParams {
  const params = new URLSearchParams({
    limit: String(SHOP_PRODUCTS_PER_PAGE),
    page: String(page),
  })

  if (filters.searchValue) params.set('q', filters.searchValue)
  if (filters.sort) params.set('sort', filters.sort)
  if (filters.brandId) params.set('brandId', filters.brandId)
  if (filters.categoryId) params.set('categoryId', filters.categoryId)
  if (filters.categorySlug) params.set('categorySlug', filters.categorySlug)
  if (filters.subcategoryId) params.set('subcategoryId', filters.subcategoryId)
  if (filters.inStockOnly) params.set('inStock', '1')
  if (filters.minPrice != null) params.set('minPrice', String(filters.minPrice))
  if (filters.maxPrice != null) params.set('maxPrice', String(filters.maxPrice))

  return params
}

function ProductCardSkeleton() {
  return (
    <div
      aria-hidden
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-sm"
    >
      <div className="p-3 sm:p-4">
        <div className="aspect-square animate-pulse rounded-xl bg-muted/50" />
        <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-muted/50" />
        <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-muted/40" />
      </div>
    </div>
  )
}

export function ShopProductsInfiniteGrid({
  filters,
  initialHasMore,
  initialProducts,
  listingKey,
}: Props) {
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const inFlightRef = useRef(false)

  const [products, setProducts] = useState(initialProducts)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [page, setPage] = useState(1)
  const [fetchState, setFetchState] = useState<FetchState>('idle')

  useEffect(() => {
    setProducts(initialProducts)
    setHasMore(initialHasMore)
    setPage(1)
    setFetchState('idle')
    inFlightRef.current = false
  }, [listingKey, initialHasMore, initialProducts])

  const fetchPage = useCallback(
    async (nextPage: number) => {
      if (inFlightRef.current) return null

      inFlightRef.current = true
      setFetchState('loadingMore')

      try {
        const params = buildSearchParams(filters, nextPage)
        const res = await fetch(`/api/shop-products?${params.toString()}`)
        if (!res.ok) throw new Error('fetch failed')

        return (await res.json()) as {
          docs: Partial<Product>[]
          hasNextPage: boolean
          page: number
        }
      } catch {
        setFetchState('error')
        return null
      } finally {
        inFlightRef.current = false
      }
    },
    [filters],
  )

  const loadMore = useCallback(() => {
    if (!hasMore || fetchState === 'loadingMore' || inFlightRef.current) return

    const nextPage = page + 1

    void fetchPage(nextPage).then((data) => {
      if (!data) return

      setProducts((prev) => {
        const seen = new Set(prev.map((p) => p.id))
        const merged = [...prev]
        for (const doc of data.docs) {
          if (doc.id && !seen.has(doc.id)) {
            merged.push(doc)
            seen.add(doc.id)
          }
        }
        return merged
      })
      setPage(data.page)
      setHasMore(data.hasNextPage)
      setFetchState('idle')
    })
  }, [fetchPage, fetchState, hasMore, page])

  const retry = useCallback(() => {
    setFetchState('idle')
    loadMore()
  }, [loadMore])

  useEffect(() => {
    const node = loadMoreRef.current
    if (!node || !hasMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore()
        }
      },
      { rootMargin: '240px 0px' },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [hasMore, loadMore, listingKey])

  return (
    <>
      <Grid className="grid grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4">
        {products.map((product, index) => (
          <ProductGridItem key={product.id} priority={index === 0} product={product} />
        ))}
        {fetchState === 'loadingMore'
          ? Array.from({ length: Math.min(4, SHOP_PRODUCTS_PER_PAGE) }).map((_, index) => (
              <ProductCardSkeleton key={`skeleton-${index}`} />
            ))
          : null}
      </Grid>

      <div aria-hidden className="h-4" ref={loadMoreRef} />

      {fetchState === 'error' && products.length > 0 ? (
        <div className="flex justify-center pt-2">
          <button
            className="rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
            onClick={retry}
            type="button"
          >
            Retry loading more
          </button>
        </div>
      ) : null}
    </>
  )
}
