'use client'

import { Price } from '@/components/Price'
import { useCartSheet } from '@/components/Cart/CartSheetContext'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { ShoppingBag } from 'lucide-react'
import React, { useMemo } from 'react'

export function FloatingCartBubble() {
  const { cart } = useCart()
  const { open } = useCartSheet()

  const totalQuantity = useMemo(() => {
    if (!cart?.items?.length) return 0
    return cart.items.reduce((q, item) => (item.quantity ?? 0) + q, 0)
  }, [cart])

  const itemLabel =
    totalQuantity === 1 ? '1 Item' : `${totalQuantity} Items`

  return (
    <button
      type="button"
      aria-label={`Open cart, ${totalQuantity} items`}
      className="cursor-pointer fixed right-0 top-1/2 z-45 flex w-19 -translate-y-1/2 flex-col overflow-hidden rounded-l-[12px] border-0 p-0 text-left shadow-[-6px_4px_20px_-4px_rgba(0,0,0,0.22)] outline-none ring-offset-2 transition-opacity hover:opacity-95 focus-visible:ring-2 focus-visible:ring-ring"
      onClick={() => open()}
    >
      <span className="flex min-h-2 flex-col items-center justify-center gap-1 bg-primary px-1 py-2 text-primary-foreground">
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
