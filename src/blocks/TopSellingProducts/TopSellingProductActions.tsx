'use client'

import type { Product } from '@/payload-types'

import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { ShoppingCartIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useCallback } from 'react'
import { toast } from 'sonner'

import { cn } from '@/utilities/cn'

type Props = {
  canAddSimple: boolean
  enableVariants?: boolean | null
  isSoldOut: boolean
  itemURL: string
  productId?: number | null
}

export function TopSellingProductActions({
  canAddSimple,
  enableVariants,
  isSoldOut,
  itemURL,
  productId,
}: Props) {
  const router = useRouter()
  const { addItem, isLoading } = useCart()

  const actionClass =
    'inline-flex min-h-11 w-full min-w-0 touch-manipulation select-none items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-sm font-semibold leading-tight [hyphens:auto] active:opacity-90 disabled:pointer-events-none disabled:opacity-55 sm:gap-2 sm:px-3 lg:min-h-12 lg:w-full lg:px-2.5 lg:py-2'

  const addProductToCart = useCallback(() => {
    if (!productId) return
    void Promise.resolve(addItem({ product: productId })).then(() => {
      toast.success('Item added to cart.')
    })
  }, [addItem, productId])

  const buyNow = useCallback(() => {
    if (enableVariants) {
      router.push(itemURL)
      return
    }
    if (!productId || isSoldOut) return
    void Promise.resolve(addItem({ product: productId })).then(() => {
      router.push('/checkout')
    })
  }, [addItem, enableVariants, isSoldOut, itemURL, productId, router])

  return (
    <div className="mt-1 grid w-full min-w-0 grid-cols-1 gap-2 lg:mt-0">
      {enableVariants ? (
        <a
          className={cn(
            actionClass,
            'border border-primary bg-white text-primary shadow-sm hover:bg-primary/5 dark:bg-muted dark:hover:bg-accent',
          )}
          href={itemURL}
        >
          <ShoppingCartIcon className="size-4 shrink-0" aria-hidden />
          <span className="min-w-0 whitespace-normal text-center">Add To Cart</span>
        </a>
      ) : (
        <button
          className={cn(
            actionClass,
            'border border-primary bg-white text-primary shadow-sm hover:bg-primary/5 dark:bg-muted dark:hover:bg-accent',
          )}
          disabled={!canAddSimple || isSoldOut || isLoading}
          onClick={addProductToCart}
          type="button"
        >
          <ShoppingCartIcon className="size-4 shrink-0" aria-hidden />
          <span className="min-w-0 whitespace-normal text-center">
            {isSoldOut ? 'Sold Out' : 'Add To Cart'}
          </span>
        </button>
      )}
      <button
        className={cn(
          actionClass,
          'border border-primary bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80',
        )}
        disabled={enableVariants ? isLoading : !productId || isSoldOut || isLoading}
        onClick={buyNow}
        type="button"
      >
        <span className="min-w-0 whitespace-normal text-center">Buy now</span>
      </button>
    </div>
  )
}
