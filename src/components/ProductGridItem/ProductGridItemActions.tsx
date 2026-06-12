'use client'

import type { Product } from '@/payload-types'

import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { MinusIcon, PlusIcon, ShoppingCartIcon } from 'lucide-react'
import Link from 'next/link'
import React, { useCallback, useMemo } from 'react'
import { toast } from 'sonner'

import { CompareCheckbox } from '@/components/compare/CompareCheckbox'

type Props = {
  inventory: number
  isSoldOut: boolean
  itemURL: string
  product: Partial<Product>
}

export function ProductGridItemActions({ inventory, isSoldOut, itemURL, product }: Props) {
  const { addItem, cart, decrementItem, incrementItem, isLoading } = useCart()

  const canAddSimpleProduct = Boolean(product.id) && !product.enableVariants

  const existingItem = useMemo(() => {
    return cart?.items?.find((item) => {
      const productID = typeof item.product === 'object' ? item.product?.id : item.product
      const variantID = item.variant
        ? typeof item.variant === 'object'
          ? item.variant?.id
          : item.variant
        : undefined

      return productID === product.id && !variantID
    })
  }, [cart?.items, product.id])

  const quantity = existingItem?.quantity || 0
  const reachedInventoryLimit = quantity >= inventory

  const addProductToCart = useCallback(() => {
    if (!product.id) return

    void Promise.resolve(
      addItem({
        product: product.id,
      }),
    ).then(() => {
      toast.success('Item added to cart.')
    })
  }, [addItem, product.id])

  return (
    <footer className="mt-4 shrink-0 border-t border-border/55 pt-4 dark:border-border/50">
      <div className="flex flex-col gap-3">
        {product.enableVariants ? (
          <Link
            className="flex h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/92 active:scale-[0.99] sm:h-12 sm:text-base"
            href={itemURL}
          >
            Choose options
          </Link>
        ) : quantity > 0 && existingItem?.id ? (
          <div className="grid h-11 grid-cols-[minmax(2.75rem,4rem)_1fr_minmax(2.75rem,4rem)] overflow-hidden rounded-xl bg-primary shadow-sm sm:h-12">
            <button
              aria-label="Reduce item quantity"
              className="flex items-center justify-center text-primary-foreground transition hover:bg-primary/85 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isLoading}
              onClick={() => decrementItem(existingItem.id)}
              type="button"
            >
              <MinusIcon className="h-5 w-5" />
            </button>
            <span className="flex items-center justify-center bg-primary/95 text-base font-bold tabular-nums text-primary-foreground">
              {quantity}
            </span>
            <button
              aria-label="Increase item quantity"
              className="flex items-center justify-center text-primary-foreground transition hover:bg-primary/85 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isLoading || reachedInventoryLimit}
              onClick={() => incrementItem(existingItem.id)}
              type="button"
            >
              <PlusIcon className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <button
            className="flex h-11 min-h-[44px] w-full touch-manipulation items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/92 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-55 sm:h-12 sm:text-base"
            disabled={!canAddSimpleProduct || isSoldOut || isLoading}
            onClick={addProductToCart}
            type="button"
          >
            <ShoppingCartIcon className="h-5 w-5 shrink-0 opacity-95" />
            {isSoldOut ? 'Out of stock' : 'Add to cart'}
          </button>
        )}

        <div className="rounded-xl bg-muted/30 px-2 py-1 ring-1 ring-border/40 dark:bg-muted/15 dark:ring-border/55">
          <CompareCheckbox appearance="minimal" productId={product.id} variant="card" />
        </div>
      </div>
    </footer>
  )
}
