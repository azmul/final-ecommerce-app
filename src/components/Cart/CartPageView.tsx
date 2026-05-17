'use client'

import { CartContents, useCartSummary } from '@/components/Cart/CartContents'
import { cn } from '@/utilities/cn'

export function CartPageView() {
  const { itemTotalQty, isEmpty } = useCartSummary()

  return (
    <div
      className={cn(
        'mx-auto flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm',
        !isEmpty && 'min-h-[min(70vh,40rem)]',
      )}
    >
      <header className="shrink-0 space-y-2 border-b border-border bg-muted/25 px-6 py-7 sm:px-8">
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Cart
        </span>
        <h1 className="font-serif text-2xl font-normal tracking-tight text-foreground sm:text-3xl">
          Your bag
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {isEmpty
            ? 'Things you save for checkout appear here—with photos, options, and totals kept in sync.'
            : `${itemTotalQty} ${itemTotalQty === 1 ? 'item' : 'items'} ready for checkout.`}
        </p>
      </header>

      <div className="flex min-h-0 flex-1 flex-col">
        <CartContents variant="page" />
      </div>
    </div>
  )
}
