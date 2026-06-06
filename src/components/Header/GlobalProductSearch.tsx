'use client'

import { cn } from '@/utilities/cn'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { SearchIcon } from 'lucide-react'
import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

/** Accent for sale price and secondary actions (not the search field chrome). */
const ACCENT = '#C28135'

type SearchHit = {
  aiMatched?: boolean
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

type PanelBox = { top: number; left: number; width: number; maxH: number }

function measureSuggestPanel(rootEl: HTMLElement | null): PanelBox | null {
  if (!rootEl || typeof window === 'undefined') return null
  const r = rootEl.getBoundingClientRect()
  const gutter = 10
  let left = r.left
  let width = r.width
  if (left + width > window.innerWidth - gutter) {
    width = Math.max(240, Math.min(width, window.innerWidth - gutter * 2))
    left = Math.max(gutter, Math.min(left, window.innerWidth - width - gutter))
  }
  const bottomGap = gutter + 4
  const maxH = Math.max(140, Math.min(420, window.innerHeight - r.bottom - bottomGap))

  return { top: r.bottom + 4, left, width, maxH }
}

type Props = {
  className?: string
}

export function GlobalProductSearch({ className }: Props) {
  const router = useRouter()
  const inputId = useId()
  const listboxId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [hits, setHits] = useState<SearchHit[]>([])
  const [aiMatched, setAiMatched] = useState(false)
  const [panelBox, setPanelBox] = useState<PanelBox | null>(null)
  const [activeIndex, setActiveIndex] = useState(-1)

  const trimmed = query.trim()
  const showPanel = open && trimmed.length >= 2
  const hasViewAll = hits.length > 0
  const optionCount = hits.length + (hasViewAll ? 1 : 0)

  const optionId = useCallback(
    (index: number) => {
      if (index < hits.length) return `${listboxId}-hit-${hits[index]?.id ?? index}`
      return `${listboxId}-view-all`
    },
    [hits, listboxId],
  )

  useEffect(() => {
    if (trimmed.length < 2) {
      setHits([])
      setLoading(false)
    }
  }, [trimmed])

  useEffect(() => {
    setActiveIndex(-1)
  }, [trimmed, hits])

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
      const data = (await res.json()) as { aiMatched?: boolean; docs?: SearchHit[] }
      setAiMatched(Boolean(data.aiMatched))
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

  useLayoutEffect(() => {
    if (!showPanel) {
      setPanelBox(null)
      return
    }

    const update = () => {
      setPanelBox(measureSuggestPanel(rootRef.current))
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [showPanel, loading, hits.length])

  useEffect(() => {
    if (!showPanel) return

    const handlePointerDown = (e: Event) => {
      const t = e.target as Node
      if (rootRef.current?.contains(t)) return
      if (panelRef.current?.contains(t)) return
      setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
    }
  }, [showPanel])

  useEffect(() => {
    if (activeIndex < 0 || !panelRef.current) return
    const el = panelRef.current.querySelector(`#${CSS.escape(optionId(activeIndex))}`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, optionId])

  function goShopSearch(term: string) {
    const t = term.trim()
    if (!t) return
    router.push(`/shop?q=${encodeURIComponent(t)}`)
    setOpen(false)
    setActiveIndex(-1)
    inputRef.current?.blur()
  }

  function selectActiveOption() {
    if (activeIndex >= 0 && activeIndex < hits.length) {
      const hit = hits[activeIndex]
      if (hit) {
        router.push(`/products/${hit.slug}`)
        setOpen(false)
        setActiveIndex(-1)
        inputRef.current?.blur()
      }
      return
    }
    if (activeIndex === hits.length && hasViewAll) {
      goShopSearch(trimmed)
      return
    }
    goShopSearch(trimmed)
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setOpen(false)
      setActiveIndex(-1)
      inputRef.current?.blur()
      return
    }

    if (!showPanel || optionCount === 0) {
      if (e.key === 'Enter') {
        e.preventDefault()
        goShopSearch(trimmed)
      }
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((cur) => {
        if (cur < 0) return 0
        return Math.min(cur + 1, optionCount - 1)
      })
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((cur) => Math.max(cur - 1, -1))
      return
    }

    if (e.key === 'Enter') {
      e.preventDefault()
      selectActiveOption()
    }
  }

  const suggestPanel = showPanel && panelBox && (
    <div
      ref={panelRef}
      aria-label="Product suggestions"
      className={cn(
        'flex flex-col overflow-hidden rounded-xl border border-border bg-background shadow-xl',
        'text-foreground dark:bg-card',
      )}
      id={listboxId}
      role="listbox"
      style={{
        position: 'fixed',
        top: panelBox.top,
        left: panelBox.left,
        width: panelBox.width,
        maxHeight: panelBox.maxH,
        zIndex: 200,
      }}
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
        <>
          {aiMatched ?
            <p className="border-b border-border px-3 py-2 text-xs font-medium text-primary">
              AI matched results
            </p>
          : null}
        <ul className="min-h-0 flex-1 divide-y divide-border overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]">
          {hits.map((hit, index) => {
            const isActive = activeIndex === index
            return (
              <li key={hit.id} role="presentation">
                <Link
                  aria-selected={isActive}
                  className={cn(
                    'flex gap-3 px-3 py-3 transition-colors min-h-13 touch-manipulation sm:min-h-0',
                    isActive ? 'bg-muted' : 'hover:bg-muted/80 active:bg-muted',
                  )}
                  href={`/products/${hit.slug}`}
                  id={optionId(index)}
                  role="option"
                  onClick={() => {
                    setOpen(false)
                    setActiveIndex(-1)
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  <div className="relative size-[52px] shrink-0 overflow-hidden rounded-lg border border-border bg-muted/40">
                    {hit.thumbnailUrl ? (
                      <Image
                        alt={hit.title}
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
                        <span className="text-sm font-medium text-muted-foreground line-through">
                          {formatBdt(hit.listPrice)}
                        </span>
                      ) : null}
                    </p>
                    {hit.brandName ? (
                      <p className="mt-1 truncate text-sm text-foreground">{hit.brandName}</p>
                    ) : null}
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
        </>
      ) : null}
      {hasViewAll ? (
        <button
          aria-selected={activeIndex === hits.length}
          className={cn(
            'w-full shrink-0 touch-manipulation border-t border-border py-3.5 text-center text-sm font-semibold transition-colors sm:py-3',
            activeIndex === hits.length ?
              'bg-muted text-foreground'
            : 'bg-background hover:bg-muted/60 active:bg-muted dark:bg-card',
          )}
          id={optionId(hits.length)}
          role="option"
          style={{ color: ACCENT }}
          type="button"
          onClick={() => goShopSearch(trimmed)}
          onMouseEnter={() => setActiveIndex(hits.length)}
        >
          View all results for &quot;{trimmed}&quot;
        </button>
      ) : null}
    </div>
  )

  return (
    <>
      <div ref={rootRef} className={cn('relative z-10 w-full', className)}>
        <form
          aria-label="Search products"
          className="relative w-full"
          onSubmit={(e) => {
            e.preventDefault()
            selectActiveOption()
          }}
          role="search"
        >
          <label className="sr-only" htmlFor={inputId}>
            Search products
          </label>
          <input
            ref={inputRef}
            aria-activedescendant={
              activeIndex >= 0 && showPanel && optionCount > 0 ? optionId(activeIndex) : undefined
            }
            aria-autocomplete="list"
            aria-controls={showPanel ? listboxId : undefined}
            aria-expanded={Boolean(showPanel && (hits.length || loading))}
            aria-haspopup="listbox"
            autoComplete="off"
            role="combobox"
            className={cn(
              'w-full rounded-lg border border-border bg-background px-3.5 py-3 pr-11 text-base outline-none transition-[box-shadow,border-color]',
              'min-h-11 text-foreground sm:py-2.5 sm:text-sm',
              'placeholder:text-muted-foreground',
              'focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
            )}
            id={inputId}
            name="header-product-search"
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
            placeholder="Search for products..."
            enterKeyHint="search"
            type="search"
            value={query}
            onKeyDown={handleInputKeyDown}
          />
          <div className="pointer-events-none absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-end text-muted-foreground">
            <SearchIcon aria-hidden className="size-5 shrink-0" strokeWidth={2} />
          </div>
        </form>
      </div>
      {typeof document !== 'undefined' && suggestPanel ? createPortal(suggestPanel, document.body) : null}
    </>
  )
}
