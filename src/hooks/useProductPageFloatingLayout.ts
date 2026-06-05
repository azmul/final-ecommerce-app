'use client'

import { isProductDetailPath } from '@/lib/isProductDetailPath'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export const PRODUCT_BUY_BAR_BODY_CLASS = 'product-buy-bar-visible'

/**
 * Coordinates fixed chat/cart/compare chrome on mobile product detail pages so they
 * do not overlap the sticky buy bar or purchase panel.
 */
export function useProductPageFloatingLayout() {
  const pathname = usePathname()
  const isProductPage = isProductDetailPath(pathname)
  const [buyBarVisible, setBuyBarVisible] = useState(false)

  useEffect(() => {
    const sync = () => {
      setBuyBarVisible(document.body.classList.contains(PRODUCT_BUY_BAR_BODY_CLASS))
    }

    sync()

    const observer = new MutationObserver(sync)
    observer.observe(document.body, { attributeFilter: ['class'], attributes: true })

    return () => observer.disconnect()
  }, [])

  const mobileBottomClass =
    !isProductPage ? 'bottom-4'
    : buyBarVisible ? 'bottom-[max(10.75rem,env(safe-area-inset-bottom))]'
    : 'bottom-[max(5.75rem,env(safe-area-inset-bottom))]'

  return {
    buyBarVisible,
    isProductPage,
    mobileBottomClass,
  }
}
