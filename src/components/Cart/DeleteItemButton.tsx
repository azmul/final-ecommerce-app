'use client'

import type { CartItem } from '@/components/Cart'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { cn } from '@/utilities/cn'
import { Trash2 } from 'lucide-react'
import React from 'react'

export function DeleteItemButton({ item }: { item: CartItem }) {
  const { isLoading, removeItem } = useCart()
  const itemId = item.id

  return (
    <form>
      <button
        aria-label="Remove item from cart"
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:border-destructive/40 hover:bg-destructive/[0.06] hover:text-destructive',
          (!itemId || isLoading) && 'pointer-events-none opacity-45',
        )}
        disabled={!itemId || isLoading}
        onClick={(e: React.FormEvent<HTMLButtonElement>) => {
          e.preventDefault()
          if (itemId) removeItem(itemId)
        }}
        type="button"
      >
        <Trash2 aria-hidden className="h-4 w-4 shrink-0" strokeWidth={1.75} />
      </button>
    </form>
  )
}
