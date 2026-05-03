'use client'

import { cn } from '@/utilities/cn'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { SearchIcon } from 'lucide-react'
import React, { useCallback, useEffect, useId, useRef, useState } from 'react'

/** Accent for sale price and secondary actions (not the search field chrome). */
const ACCENT = '#C28135'

type SearchHit = {
  id: number
  title: string
  slug: string
  thumbnailUrl: string | null
  brandName: string | null
  listPrice: number | null
  salePrice: number | null
  hasDiscount: boolean
}

function formatBdt(amount: number): string {
  const n = Number.isFinite(amount) ? amount : 0
  return `৳${n.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

type Props = {
  className?: string
}

export function GlobalProductSearch({ className }: Props) {
  const router = useRouter()
  const inputId = useId()
  const listboxId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [hits, setHits] = useState<SearchHit[]>([])

  const trimmed = query.trim()
  const showPanel = open && trimmed.length >= 2

  useEffect(() => {
    if (trimmed.length < 2) {
      setHits([])
      setLoading(false)
    }
  }, [trimmed])

  const fetchHits = useCallback(async (term: string) => {
    if (term.length < 2) {
      setHits([])
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/product-search?q=${encodeURIComponent(term)}`, {
        cache: 'no-store',
      })
      if (!res.ok) {
        setHits([])
        return
      }
      const data = (await res.json()) as { docs?: SearchHit[] }
      setHits(Array.isArray(data.docs) ? data.docs : [])
    } catch {
      setHits([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!showPanel || trimmed.length < 2) return

    let cancelled = false
    const t = window.setTimeout(() => {
      void (async () => {
        if (cancelled) return
        await fetchHits(trimmed)
      })()
    }, 280)

    return () => {
      cancelled = true
      window.clearTimeout(t)
    }
  }, [trimmed, showPanel, fetchHits])

  useEffect(() => {
    const handlePointerDown = (e: Event) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
    }
  }, [])

  function goShopSearch(term: string) {
    const t = term.trim()
    if (!t) return
    router.push(`/shop?q=${encodeURIComponent(t)}`)
    setOpen(false)
    inputRef.current?.blur()
  }

  return (
    <div ref={rootRef} className={cn('relative w-full', className)}>
      <form
        aria-label="Search products"
        className="relative w-full"
        onSubmit={(e) => {
          e.preventDefault()
          goShopSearch(trimmed)
        }}
        role="search"
      >
        <label className="sr-only" htmlFor={inputId}>
          Search products
        </label>
        <input
          ref={inputRef}
          aria-autocomplete="list"
          aria-controls={hits.length ? listboxId : undefined}
          aria-expanded={Boolean(showPanel && (hits.length || loading))}
          autoComplete="off"
          className={cn(
            /* 16px+ on narrow viewports avoids iOS input zoom */
            'w-full rounded-lg border border-border px-3.5 py-3 pr-11 text-base outline-none transition-[box-shadow,border-color]',
            'min-h-11 text-foreground sm:py-2.5 sm:text-sm',
            'placeholder:text-muted-foreground',
            'focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
          )}
          id={inputId}
          name="header-product-search"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--background) 92%, #faf8f6)',
          }}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Search for products..."
          enterKeyHint="search"
          type="search"
          value={query}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setOpen(false)
              inputRef.current?.blur()
            }
          }}
        />
        <div className="pointer-events-none absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-end text-muted-foreground">
          <SearchIcon aria-hidden className="size-5 shrink-0" strokeWidth={2} />
        </div>
      </form>

      {showPanel ? (
        <div
          className={cn(
            'absolute inset-x-0 top-full z-[75] mt-1',
            'flex max-h-[min(420px,calc(100vh-140px))] flex-col overflow-hidden rounded-b-xl rounded-t-md border border-neutral-200/90 bg-[#fdfcfb] shadow-md dark:border-neutral-700 dark:bg-neutral-950',
            'supports-[height:100dvh]:max-h-[min(420px,calc(100dvh-10rem))]',
          )}
          id={listboxId}
          role="listbox"
          aria-label="Product suggestions"
        >
          {loading && !hits.length ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">Searching…</p>
          ) : null}
          {!loading && !hits.length ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              No matching products yet.
            </p>
          ) : null}
          {hits.length > 0 ? (
            <ul className="min-h-0 flex-1 divide-y divide-neutral-200 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] dark:divide-neutral-800">
              {hits.map((hit) => (
                <li key={hit.id} role="presentation">
                  <Link
                    className={cn(
                      'flex gap-3 px-3 py-3 transition-colors hover:bg-neutral-100/80 active:bg-neutral-200/55 dark:hover:bg-neutral-900/70 dark:active:bg-neutral-900',
                      'min-h-13 touch-manipulation sm:min-h-0',
                    )}
                    href={`/products/${hit.slug}`}
                    role="option"
                    onClick={() => setOpen(false)}
                  >
                    <div className="relative size-[52px] shrink-0 overflow-hidden rounded-lg border border-neutral-200/90 bg-muted/40 dark:border-neutral-700">
                      {hit.thumbnailUrl ? (
                        <Image
                          alt=""
                          className="object-contain p-1"
                          fill
                          sizes="52px"
                          src={hit.thumbnailUrl}
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-foreground">{hit.title}</p>
                      <p className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        {typeof hit.salePrice === 'number' ? (
                          <span className="font-bold" style={{ color: ACCENT }}>
                            {formatBdt(hit.salePrice)}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">See product</span>
                        )}
                        {hit.hasDiscount && typeof hit.listPrice === 'number' ? (
                          <span className="text-sm font-medium text-muted-foreground line-through dark:text-muted-foreground/85">
                            {formatBdt(hit.listPrice)}
                          </span>
                        ) : null}
                      </p>
                      {hit.brandName ? (
                        <p className="mt-1 truncate text-sm text-foreground/90">{hit.brandName}</p>
                      ) : null}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
          {hits.length ? (
            <button
              className={cn(
                'w-full shrink-0 touch-manipulation border-t border-neutral-200 py-3.5 text-center text-sm font-semibold transition-colors hover:bg-neutral-100/70 active:bg-neutral-200/55 dark:border-neutral-800 dark:hover:bg-neutral-900/55 sm:py-3',
              )}
              style={{ color: ACCENT }}
              type="button"
              onClick={() => goShopSearch(trimmed)}
            >
              View all results for &quot;{trimmed}&quot;
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
