'use client'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { usePathname } from 'next/navigation'
import React, { useEffect } from 'react'

import { CartContents, useCartSummary } from './CartContents'
import { useCartSheet } from './CartSheetContext'
import { cn } from '@/utilities/cn'

export function CartModal() {
  const { isOpen, setOpen } = useCartSheet()
  const { itemTotalQty, isEmpty } = useCartSummary()
  const pathname = usePathname()

  useEffect(() => {
    if (pathname === '/cart') return
    setOpen(false)
  }, [pathname, setOpen])

  return (
    <Sheet onOpenChange={setOpen} open={isOpen}>
      <SheetContent
        overlayClassName="bg-black/55 backdrop-blur-[2px] motion-reduce:backdrop-blur-none motion-safe:data-[state=open]:duration-500 motion-safe:data-[state=closed]:duration-220"
        className={cn(
          'flex h-full max-h-[100dvh] w-full flex-col gap-0 border-l border-border bg-card p-0 shadow-xl motion-safe:data-[state=closed]:ease-in motion-safe:data-[state=open]:ease-[cubic-bezier(0.33,1,0.68,1)] motion-safe:data-[state=open]:duration-500 motion-safe:data-[state=closed]:duration-280 sm:max-w-md',
        )}
      >
        <SheetHeader className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-3 motion-safe:duration-400 motion-safe:ease-out shrink-0 space-y-2 border-b border-border bg-muted/25 px-6 py-7 pr-14 text-left">
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Cart
          </span>
          <SheetTitle className="font-serif text-2xl font-normal tracking-tight text-foreground">
            Your bag
          </SheetTitle>
          <SheetDescription className="text-sm leading-relaxed text-muted-foreground">
            {isEmpty
              ? 'Things you save for checkout appear here—with photos, options, and totals kept in sync.'
              : `${itemTotalQty} ${itemTotalQty === 1 ? 'item' : 'items'} ready for checkout. Adjust quantities or remove lines below.`}
          </SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col">
          <CartContents onNavigate={() => setOpen(false)} variant="sheet" />
        </div>
      </SheetContent>
    </Sheet>
  )
}
