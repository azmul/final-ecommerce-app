'use client'

import { AddToCart } from '@/components/Cart/AddToCart'
import { ProductPriceDisplay } from '@/components/product/ProductPriceDisplay'
import type { Product } from '@/payload-types'
import { cn } from '@/utilities/cn'
import { Suspense, useEffect, useState } from 'react'

type Props = {
  product: Product
}

/** Sticky add-to-cart bar on small screens when the main purchase block scrolls away. */
export function ProductMobileBuyBar({ product }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const target = document.getElementById('purchase')
    if (!target) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(!entry.isIntersecting)
      },
      { threshold: 0 },
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      aria-hidden={!visible}
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/95 shadow-[0_-10px_40px_-16px_rgba(0,0,0,0.35)] backdrop-blur-md transition-transform duration-300 ease-out lg:hidden',
        'px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3',
        visible ? 'translate-y-0' : 'pointer-events-none translate-y-full',
      )}
    >
      <div className="mx-auto flex w-full max-w-lg items-center gap-3">
        <div className="min-w-0 shrink-0">
          <Suspense fallback={<div className="h-7 w-24 animate-pulse rounded-lg bg-muted/60" aria-hidden />}>
            <ProductPriceDisplay product={product} size="default" />
          </Suspense>
        </div>
        <div className="min-w-0 flex-1">
          <Suspense fallback={null}>
            <AddToCart
              buttonClassName="min-h-11 w-full rounded-xl text-sm font-semibold shadow-md"
              product={product}
            />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
