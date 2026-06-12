'use client'

import type { Media, Product } from '@/payload-types'

import type { CategoryTab } from '@/blocks/CategoryProductShowcase/types'
import type { CategoryProductShowcaseSort } from '@/blocks/CategoryProductShowcase/fetchProducts'
import { Media as MediaCmp } from '@/components/Media'
import { Price } from '@/components/Price'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel'
import { WishlistButton } from '@/components/WishlistButton'
import { PRODUCT_CARD_IMAGE_SIZES } from '@/lib/seo/imageSizes'
import { cmsBlockShellClassName } from '@/utilities/cmsLayout'
import { cn } from '@/utilities/cn'
import Link from 'next/link'
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react'

type Props = {
  categoryIds: string[]
  heading?: string
  headingId: string
  initialCategoryId: string
  initialHasMore: boolean
  initialProducts: Partial<Product>[]
  productsPerPage: number
  sort: CategoryProductShowcaseSort
  tabs: CategoryTab[]
}

type CategoryCacheEntry = {
  hasMore: boolean
  page: number
  products: Partial<Product>[]
}

type FetchState = 'idle' | 'loading' | 'loadingMore' | 'error'

function getProductPrice(product: Partial<Product>): number | undefined {
  let price = product.priceInBDT
  const variants = product.variants?.docs
  if (variants?.length) {
    const variant = variants[0]
    if (variant && typeof variant === 'object' && typeof variant.priceInBDT === 'number') {
      price = variant.priceInBDT
    }
  }
  return typeof price === 'number' ? price : undefined
}

function ShowcaseCard({ product, priority }: { product: Partial<Product>; priority?: boolean }) {
  const { gallery, title, slug } = product
  const images = useMemo(
    () =>
      (gallery ?? []).flatMap((entry) =>
        entry?.image && typeof entry.image !== 'string' ? [entry.image as Media] : [],
      ),
    [gallery],
  )

  const [carouselApi, setCarouselApi] = useState<CarouselApi>()
  const [imageIndex, setImageIndex] = useState(0)

  useEffect(() => {
    if (!carouselApi) return

    const onSelect = () => setImageIndex(carouselApi.selectedScrollSnap())

    onSelect()
    carouselApi.on('select', onSelect)
    carouselApi.on('reInit', onSelect)

    return () => {
      carouselApi.off('select', onSelect)
      carouselApi.off('reInit', onSelect)
    }
  }, [carouselApi])

  const mainPrice = getProductPrice(product)
  const discountFromField =
    typeof product.discountPercentage === 'number' ? Math.round(product.discountPercentage) : 0
  const discountPercent = Math.min(Math.max(discountFromField, 0), 100)
  const hasDiscount = discountPercent > 0
  const discountedPrice =
    typeof mainPrice === 'number' && hasDiscount
      ? Math.round(mainPrice * (100 - discountPercent)) / 100
      : mainPrice

  const itemURL = slug ? `/products/${slug}` : '#'

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-[#FCE4EC] bg-white shadow-[0_2px_12px_-4px_rgba(216,27,96,0.12)]">
      <div className="relative">
        <Link
          aria-label={`View ${title ?? 'product'}`}
          className="relative block aspect-square overflow-hidden bg-[#FAFAFA]"
          href={itemURL}
        >
          {images.length > 0 ? (
            images.length === 1 ? (
              <MediaCmp
                className="relative size-full"
                fill
                imgClassName="object-contain p-2"
                priority={priority}
                resource={images[0]}
                size={PRODUCT_CARD_IMAGE_SIZES}
              />
            ) : (
              <Carousel className="size-full" opts={{ loop: true }} setApi={setCarouselApi}>
                <CarouselContent className="ml-0 h-full">
                  {images.map((image, index) => (
                    <CarouselItem className="basis-full pl-0" key={image.id ?? index}>
                      <div className="relative aspect-square size-full">
                        <MediaCmp
                          className="relative size-full"
                          fill
                          imgClassName="object-contain p-2"
                          priority={priority && index === 0}
                          resource={image}
                          size={PRODUCT_CARD_IMAGE_SIZES}
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            )
          ) : (
            <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
              No image
            </div>
          )}
        </Link>

        {images.length > 1 ? (
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1"
          >
            {images.map((_, index) => (
              <span
                className={cn(
                  'size-1.5 rounded-full transition',
                  index === imageIndex ? 'w-3 bg-[#D81B60]' : 'bg-[#333333]/25',
                )}
                key={index}
              />
            ))}
          </div>
        ) : null}

        <WishlistButton
          className="absolute bottom-2 right-2 z-10 size-9 border-[#F8BBD0] bg-white/95 text-[#D81B60] hover:text-[#D81B60]"
          product={product}
        />
      </div>

      <div className="flex flex-1 flex-col gap-1.5 px-2.5 pb-3 pt-2.5">
        <Link className="block min-w-0" href={itemURL}>
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-[#212121]">
            {title}
          </h3>
        </Link>

        <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
          {typeof discountedPrice === 'number' ? (
            <Price
              amount={discountedPrice}
              as="span"
              className="text-sm font-bold tabular-nums text-[#D81B60] sm:text-base"
            />
          ) : null}
          {hasDiscount && typeof mainPrice === 'number' ? (
            <Price
              amount={mainPrice}
              as="span"
              className="text-xs tabular-nums text-[#757575] line-through"
            />
          ) : null}
          {hasDiscount ? (
            <span className="text-[11px] font-semibold text-[#F9A825] sm:text-xs">
              ({discountPercent}% OFF)
            </span>
          ) : null}
        </div>
      </div>
    </article>
  )
}

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-[#FCE4EC] bg-white">
      <div className="aspect-square animate-pulse bg-[#FCE4EC]/40" />
      <div className="space-y-2 p-2.5">
        <div className="h-4 w-full animate-pulse rounded bg-[#FCE4EC]/50" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-[#FCE4EC]/50" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-[#FCE4EC]/40" />
      </div>
    </div>
  )
}

function TabSkeleton() {
  return (
    <div className="h-9 w-20 shrink-0 animate-pulse rounded-full bg-[#FCE4EC]/60 sm:h-10 sm:w-24" />
  )
}

export function CategoryProductShowcaseClient({
  categoryIds,
  heading,
  headingId,
  initialCategoryId,
  initialHasMore,
  initialProducts,
  productsPerPage,
  sort,
  tabs,
}: Props) {
  const cacheRef = useRef<Map<string, CategoryCacheEntry>>(new Map())
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const inFlightRef = useRef(false)

  const [activeCategoryId, setActiveCategoryId] = useState(initialCategoryId)
  const [products, setProducts] = useState<Partial<Product>[]>(initialProducts)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [page, setPage] = useState(1)
  const [fetchState, setFetchState] = useState<FetchState>('idle')
  const [, startTransition] = useTransition()

  useEffect(() => {
    cacheRef.current.set(initialCategoryId, {
      hasMore: initialHasMore,
      page: 1,
      products: initialProducts,
    })
  }, [initialCategoryId, initialHasMore, initialProducts])

  const updateCache = useCallback((categoryId: string, entry: CategoryCacheEntry) => {
    cacheRef.current.set(categoryId, entry)
  }, [])

  const fetchProducts = useCallback(
    async (categoryId: string, nextPage: number, append: boolean) => {
      if (inFlightRef.current) return null

      inFlightRef.current = true
      setFetchState(append ? 'loadingMore' : 'loading')

      const params = new URLSearchParams({
        categoryId,
        categoryIds: categoryIds.join(','),
        limit: String(productsPerPage),
        page: String(nextPage),
        sort,
      })

      try {
        const res = await fetch(`/api/category-product-showcase?${params.toString()}`)
        if (!res.ok) throw new Error('fetch failed')

        const data = (await res.json()) as {
          docs: Partial<Product>[]
          hasNextPage: boolean
          page: number
        }

        return data
      } catch {
        setFetchState('error')
        return null
      } finally {
        inFlightRef.current = false
      }
    },
    [categoryIds, productsPerPage, sort],
  )

  const applyProducts = useCallback(
    (categoryId: string, docs: Partial<Product>[], nextPage: number, nextHasMore: boolean) => {
      setProducts(docs)
      setPage(nextPage)
      setHasMore(nextHasMore)
      updateCache(categoryId, { products: docs, page: nextPage, hasMore: nextHasMore })
      setFetchState('idle')
    },
    [updateCache],
  )

  const selectCategory = useCallback(
    (categoryId: string) => {
      if (categoryId === activeCategoryId) return

      setActiveCategoryId(categoryId)

      const cached = cacheRef.current.get(categoryId)
      if (cached) {
        setProducts(cached.products)
        setPage(cached.page)
        setHasMore(cached.hasMore)
        setFetchState('idle')
        return
      }

      setProducts([])
      setPage(1)
      setHasMore(false)

      startTransition(() => {
        void fetchProducts(categoryId, 1, false).then((data) => {
          if (!data) return
          applyProducts(categoryId, data.docs, data.page, data.hasNextPage)
        })
      })
    },
    [activeCategoryId, applyProducts, fetchProducts],
  )

  const loadMore = useCallback(() => {
    if (!hasMore || fetchState === 'loading' || fetchState === 'loadingMore' || inFlightRef.current) {
      return
    }

    const nextPage = page + 1

    void fetchProducts(activeCategoryId, nextPage, true).then((data) => {
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
        updateCache(activeCategoryId, {
          products: merged,
          page: data.page,
          hasMore: data.hasNextPage,
        })
        return merged
      })
      setPage(data.page)
      setHasMore(data.hasNextPage)
      setFetchState('idle')
    })
  }, [activeCategoryId, fetchProducts, fetchState, hasMore, page, updateCache])

  const retry = useCallback(() => {
    if (products.length > 0) {
      setFetchState('idle')
      loadMore()
      return
    }

    setFetchState('idle')
    void fetchProducts(activeCategoryId, 1, false).then((data) => {
      if (!data) return
      applyProducts(activeCategoryId, data.docs, data.page, data.hasNextPage)
    })
  }, [activeCategoryId, applyProducts, fetchProducts, loadMore, products.length])

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
  }, [hasMore, loadMore, activeCategoryId])

  const isInitialLoading = fetchState === 'loading' && products.length === 0
  const isEmpty = fetchState !== 'loading' && products.length === 0 && fetchState !== 'error'
  const showGridSkeleton = isInitialLoading

  return (
    <section
      aria-labelledby={heading ? headingId : undefined}
      className={cn(cmsBlockShellClassName, 'rounded-xl bg-[#FFF5F8] px-3 py-5 sm:px-5 sm:py-7')}
    >
      {heading ? (
        <h2
          className="mb-5 text-center text-lg font-semibold tracking-tight text-[#333333] sm:mb-6 sm:text-xl"
          id={headingId}
        >
          {heading}
        </h2>
      ) : null}

      <nav aria-label="Product categories" className="mb-5 sm:mb-6">
        <ul className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:justify-center sm:gap-2.5">
          {tabs.length === 0
            ? Array.from({ length: 5 }).map((_, i) => (
                <li key={i}>
                  <TabSkeleton />
                </li>
              ))
            : tabs.map((tab) => {
                const isActive = tab.id === activeCategoryId
                return (
                  <li className="shrink-0" key={tab.id}>
                    <button
                      aria-current={isActive ? 'true' : undefined}
                      className={cn(
                        'whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition sm:px-5 sm:py-2.5',
                        isActive
                          ? 'bg-[#D81B60] text-white shadow-sm'
                          : 'text-[#AD1457] hover:bg-[#FCE4EC]/80',
                      )}
                      onClick={() => selectCategory(tab.id)}
                      type="button"
                    >
                      {tab.title}
                    </button>
                  </li>
                )
              })}
        </ul>
      </nav>

      {fetchState === 'error' && products.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#F8BBD0] bg-white/80 px-6 py-12 text-center">
          <p className="text-base font-medium text-[#333333]">Could not load products</p>
          <p className="mt-1 text-sm text-muted-foreground">Check your connection and try again.</p>
          <button
            className="mt-4 rounded-full bg-[#D81B60] px-5 py-2 text-sm font-semibold text-white hover:bg-[#C2185B]"
            onClick={retry}
            type="button"
          >
            Retry
          </button>
        </div>
      ) : isEmpty ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#F8BBD0] bg-white/80 px-6 py-12 text-center">
          <p className="text-base font-medium text-[#333333]">No products in this category</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try another category or check back later.
          </p>
        </div>
      ) : (
        <>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {showGridSkeleton
              ? Array.from({ length: productsPerPage }).map((_, index) => (
                  <li key={`skeleton-${index}`}>
                    <CardSkeleton />
                  </li>
                ))
              : products.map((product, index) =>
                  product.id ? (
                    <li key={product.id}>
                      <ShowcaseCard priority={index < 2} product={product} />
                    </li>
                  ) : null,
                )}
            {fetchState === 'loadingMore'
              ? Array.from({ length: Math.min(6, productsPerPage) }).map((_, index) => (
                  <li aria-hidden key={`more-skeleton-${index}`}>
                    <CardSkeleton />
                  </li>
                ))
              : null}
          </ul>

          <div aria-hidden className="h-4" ref={loadMoreRef} />

          {fetchState === 'error' && products.length > 0 ? (
            <div className="mt-4 flex justify-center">
              <button
                className="rounded-full border border-[#D81B60] px-4 py-2 text-sm font-semibold text-[#D81B60] hover:bg-[#FCE4EC]"
                onClick={retry}
                type="button"
              >
                Retry loading more
              </button>
            </div>
          ) : null}
        </>
      )}
    </section>
  )
}
