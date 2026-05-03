'use client'

import { Category } from '@/payload-types'
import { cn } from '@/utilities/cn'
import { ChevronDown } from 'lucide-react'
import { usePathname } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'

import { CategoryItem } from './Categories.client'

const panelId = 'shop-sidebar-categories'

/** iPad Safari (incl. “desktop” UA with touch). Not used for sizing — only eligibility. */
function isIpadOsBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  if (/iPad/i.test(navigator.userAgent)) return true
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
}

/**
 * Heuristic screen sizes for iPad **Pro** only (logical points, ±chrome).
 * Excludes typical iPad / iPad mini / most iPad Air viewports — no reliable OS API exists.
 */
function screenMatchesLikelyIpadPro(): boolean {
  if (typeof window === 'undefined') return false

  const w = window.screen.width
  const h = window.screen.height
  const short = Math.min(w, h)
  const long = Math.max(w, h)

  // 12.9" / ~13" iPad Pro: ~1024 × 1366
  const proLarge =
    short >= 1000 && short <= 1060 && long >= 1340 && long <= 1400

  // 11" iPad Pro portrait/landscape: short ~834, long ~1194–1210 (excludes mini 744, base iPad ~810-wide)
  const pro11 = short >= 824 && short <= 858 && long >= 1170 && long <= 1250

  return Boolean(proLarge || pro11)
}

function computeIpadProCategoriesExpanded(): boolean {
  return isIpadOsBrowser() && screenMatchesLikelyIpadPro()
}

function useLikelyIpadProCategoriesExpanded(): boolean {
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    function update() {
      setExpanded(computeIpadProCategoriesExpanded())
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
    }
  }, [])

  return expanded
}

export function CategoriesSection({ categories }: { categories: Category[] }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const prevPathRef = useRef<string | null>(null)
  const ipadProLikelyExpanded = useLikelyIpadProCategoriesExpanded()

  useEffect(() => {
    const prev = prevPathRef.current
    prevPathRef.current = pathname
    if (prev !== null && prev !== pathname) {
      setOpen(false)
    }
  }, [pathname])

  return (
    <div>
      {!ipadProLikelyExpanded ? (
        <>
          <button
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            className="flex min-h-11 w-full items-center justify-between gap-2 rounded-lg px-1 py-1.5 text-left transition hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background xl:hidden"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="text-sm font-semibold text-foreground">Categories</span>
            <ChevronDown
              aria-hidden
              className={cn(
                'size-4 shrink-0 text-muted-foreground transition-transform duration-200',
                open && 'rotate-180',
              )}
            />
          </button>
          <h3 className="mb-3 hidden text-sm font-semibold text-foreground xl:block">Categories</h3>
        </>
      ) : (
        <h3 className="mb-3 text-sm font-semibold text-foreground">Categories</h3>
      )}
      <ul
        id={panelId}
        className={cn(
          'flex flex-col gap-0.5',
          ipadProLikelyExpanded
            ? 'block'
            : cn(open ? 'block' : 'max-xl:hidden', 'xl:block'),
        )}
        role="list"
      >
        {categories.map((category) => (
          <li className="list-none" key={category.id}>
            <CategoryItem category={category} />
          </li>
        ))}
      </ul>
    </div>
  )
}
