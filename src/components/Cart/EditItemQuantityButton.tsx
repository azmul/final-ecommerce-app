'use client'

import { CartItem } from '@/components/Cart'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { cn } from '@/utilities/cn'
import { MinusIcon, PlusIcon } from 'lucide-react'
import React, { useMemo } from 'react'

export function EditItemQuantityButton({ type, item }: { item: CartItem; type: 'minus' | 'plus' }) {
  const { decrementItem, incrementItem, isLoading } = useCart()

  const disabled = useMemo(() => {
    if (!item.id) return true

    const target =
      item.variant && typeof item.variant === 'object'
        ? item.variant
        : item.product && typeof item.product === 'object'
          ? item.product
          : null

    if (
      target &&
      typeof target === 'object' &&
      target.inventory !== undefined &&
      target.inventory !== null
    ) {
      if (type === 'plus' && item.quantity !== undefined && item.quantity !== null) {
        return item.quantity >= target.inventory
      }
    }

    return false
  }, [item, type])

  return (
    <form className="contents">
      <button
        disabled={disabled || isLoading}
        aria-label={type === 'plus' ? 'Increase item quantity' : 'Reduce item quantity'}
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors',
          'hover:bg-muted hover:text-foreground',
          disabled || isLoading ? 'cursor-not-allowed opacity-40' : 'hover:cursor-pointer',
        )}
        onClick={(e: React.FormEvent<HTMLButtonElement>) => {
          e.preventDefault()

          if (item.id) {
            if (type === 'plus') {
              incrementItem(item.id)
            } else {
              decrementItem(item.id)
            }
          }
        }}
        type="button"
      >
        {type === 'plus' ? (
          <PlusIcon aria-hidden className="h-4 w-4" strokeWidth={1.75} />
        ) : (
          <MinusIcon aria-hidden className="h-4 w-4" strokeWidth={1.75} />
        )}
      </button>
    </form>
  )
}
