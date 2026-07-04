'use client'

import { Price } from '@/components/Price'
import { useCartSheet } from '@/components/Cart/CartSheetContext'
import { useProductPageFloatingLayout } from '@/hooks/useProductPageFloatingLayout'
import { cn } from '@/utilities/cn'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { CART_BUMP_EVENT, CART_FLY_TARGET_ID } from '@/lib/motion/flyToCart'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { animate } from 'framer-motion'
import { ShoppingBag } from 'lucide-react'
import { usePathname } from 'next/navigation'
import React, { useEffect, useMemo, useRef } from 'react'

export function FloatingCartBubble() {
  const { cart } = useCart()
  const { open } = useCartSheet()
  const { isProductPage } = useProductPageFloatingLayout()
  const pathname = usePathname()
  const reduced = usePrefersReducedMotion()
  const iconRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (reduced) return
    const onBump = () => {
      const el = iconRef.current
      if (!el) return
      animate(el, { scale: [1, 1.3, 0.92, 1] }, { duration: 0.45, ease: 'easeOut' })
    }
    window.addEventListener(CART_BUMP_EVENT, onBump)
    return () => window.removeEventListener(CART_BUMP_EVENT, onBump)
  }, [reduced])

  const totalQuantity = useMemo(() => {
    if (!cart?.items?.length) return 0
    return cart.items.reduce((q, item) => (item.quantity ?? 0) + q, 0)
  }, [cart])

  const itemLabel =
    totalQuantity === 1 ? '1 Item' : `${totalQuantity} Items`

  // An empty peek-cart is pure chrome — on small screens it overlaps card
  // buttons and product info without offering anything to open.
  if (totalQuantity === 0) return null

  // Redundant where the cart itself (or its summary) is the page content,
  // and it covers form fields on the checkout funnel.
  if (pathname === '/cart' || pathname?.startsWith('/checkout')) return null

  return (
    <button
      type="button"
      className={cn(
        'fixed right-0 z-45 flex w-19 cursor-pointer flex-col overflow-hidden rounded-l-[12px] border-0 p-0 text-left shadow-[-6px_4px_20px_-4px_rgba(0,0,0,0.22)] outline-none ring-offset-2 transition-opacity hover:opacity-95 focus-visible:ring-2 focus-visible:ring-ring',
        isProductPage ?
          // Mobile product pages already have the sticky buy bar and header
          // cart; the mid-screen peek would only cover delivery/price info.
          'max-lg:hidden top-1/2 bottom-auto -translate-y-1/2'
        : cn(
            'top-auto translate-y-0 bottom-[max(1rem,env(safe-area-inset-bottom))]',
            'md:bottom-auto md:top-1/2 md:-translate-y-1/2',
          ),
      )}
      onClick={() => open()}
    >
      <span className="sr-only">Open cart</span>
      <span
        ref={iconRef}
        id={CART_FLY_TARGET_ID}
        className="flex min-h-2 flex-col items-center justify-center gap-1 bg-primary px-1 py-2 text-primary-foreground [transform-origin:center]"
      >
        <ShoppingBag aria-hidden className="size-7 shrink-0 stroke-white text-white" strokeWidth={2} />
        <span className="text-[12px] font-medium leading-tight">{itemLabel}</span>
      </span>
      <span className="flex min-h-2 flex-col items-center justify-center bg-white">
        <Price
          amount={cart?.subtotal ?? 0}
          as="span"
          className="text-[12px] font-bold tabular-nums leading-tight text-primary"
        />
      </span>
    </button>
  )
}
