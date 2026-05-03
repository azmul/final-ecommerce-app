'use client'

import { SHOP_BASE_PATH } from '@/utilities/shopPath'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

/** Smooth-scrolls to `#shop-products` after client-side shop navigations (e.g. category change). */
export function ScrollShopProductsOnPathChange() {
  const pathname = usePathname()
  const prevPathRef = useRef<string | null>(null)

  useEffect(() => {
    const prev = prevPathRef.current
    prevPathRef.current = pathname

    if (prev === null || prev === pathname) return
    if (!pathname.startsWith(SHOP_BASE_PATH)) return

    const id = requestAnimationFrame(() => {
      const el = document.getElementById('shop-products')
      if (!el) return
      const reduce =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      el.scrollIntoView({
        behavior: reduce ? 'auto' : 'smooth',
        block: 'start',
      })
    })

    return () => cancelAnimationFrame(id)
  }, [pathname])

  return null
}
