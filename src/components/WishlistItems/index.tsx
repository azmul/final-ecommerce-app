'use client'

import type { Media as MediaType, Product } from '@/payload-types'

import { HeartCrackIcon, ShoppingCartIcon, Trash2Icon } from 'lucide-react'
import Link from 'next/link'
import React, { useCallback } from 'react'
import { toast } from 'sonner'

import { Media } from '@/components/Media'
import { Price } from '@/components/Price'
import { Button } from '@/components/ui/button'
import { useWishlist } from '@/providers/Wishlist'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'

type WishlistProduct = Partial<Product> & { id: Product['id'] }

const getProductImage = (product: WishlistProduct) => {
  const image = product.gallery?.[0]?.image
  return image && typeof image === 'object' ? (image as MediaType) : null
}

const getPrice = (product: WishlistProduct) => {
  const price = typeof product.priceInBDT === 'number' ? product.priceInBDT : undefined
  const discountPercentage =
    typeof product.discountPercentage === 'number' ? product.discountPercentage : 0
  const discount = Math.min(Math.max(Math.round(discountPercentage), 0), 100)

  if (typeof price !== 'number') return undefined

  return {
    compareAt: discount > 0 ? price : undefined,
    current: discount > 0 ? Math.round(price * (100 - discount)) / 100 : price,
  }
}

export function WishlistItems() {
  const { addItem, isLoading: isCartLoading } = useCart()
  const { clear, error, isLoading, items, remove } = useWishlist()

  const addProductToCart = useCallback(
    async (product: WishlistProduct) => {
      if (!product.id || product.enableVariants) return

      try {
        await addItem({
          product: product.id,
        })
        toast.success('Item added to cart.')
      } catch {
        toast.error('Unable to add item to cart.')
      }
    },
    [addItem],
  )

  const clearWishlist = async () => {
    try {
      await clear()
      toast.success('Wishlist cleared.')
    } catch {
      toast.error('Unable to clear wishlist.')
    }
  }

  const removeProduct = async (productID: Product['id']) => {
    try {
      await remove(productID)
      toast.success('Removed from wishlist.')
    } catch {
      toast.error('Unable to remove item.')
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-16 text-center">
        <p className="text-sm text-muted-foreground">Loading your wishlist...</p>
      </div>
    )
  }

  if (!items.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-16 text-center sm:py-20">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <HeartCrackIcon className="h-7 w-7 text-muted-foreground" aria-hidden />
        </div>
        <p className="mt-4 max-w-md text-lg font-medium text-foreground">Your wishlist is empty</p>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Tap the heart on any product to save it here for later.
        </p>
        <Button asChild className="mt-6 rounded-xl bg-primary hover:bg-primary/90">
          <Link href="/shop">Browse products</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {items.length} saved {items.length === 1 ? 'product' : 'products'}
        </p>
        <Button onClick={clearWishlist} type="button" variant="outline">
          Clear wishlist
        </Button>
      </div>

      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4">
        {items.map((product) => {
          const image = getProductImage(product)
          const price = getPrice(product)
          const discountPct =
            typeof product.discountPercentage === 'number'
              ? Math.min(Math.max(Math.round(product.discountPercentage), 0), 100)
              : 0
          const itemURL = product.slug ? `/products/${product.slug}` : '/shop'
          const isSoldOut = !product.enableVariants && (product.inventory ?? 0) <= 0

          return (
            <article
              className="grid gap-4 rounded-2xl border border-border bg-background p-4 shadow-sm sm:grid-cols-[9rem_1fr] sm:items-center"
              key={product.id}
            >
              <Link
                aria-label={product.title || 'View product'}
                className="relative aspect-square overflow-hidden rounded-xl bg-muted/40 p-4"
                href={itemURL}
              >
                {image ? (
                  <Media
                    className="relative h-full w-full"
                    fill
                    imgClassName="object-contain"
                    resource={image}
                  />
                ) : null}
              </Link>

              <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-2">
                  <Link
                    className="block text-lg font-semibold leading-snug transition hover:text-primary"
                    href={itemURL}
                  >
                    {product.title}
                  </Link>
                  {price ? (
                    <div className="inline-flex flex-wrap items-baseline gap-x-2 gap-y-0">
                      <Price
                        amount={price.current}
                        as="span"
                        className="text-base font-bold text-primary sm:text-lg"
                      />
                      {typeof price.compareAt === 'number' ? (
                        <Price
                          amount={price.compareAt}
                          as="span"
                          className="text-sm font-medium text-muted-foreground line-through sm:text-base"
                        />
                      ) : null}
                      {discountPct > 0 ? (
                        <span className="text-xs font-bold text-primary sm:text-sm">
                          Save {discountPct}%
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {product.enableVariants ? (
                    <Button asChild className="rounded-xl" variant="outline">
                      <Link href={itemURL}>Choose Options</Link>
                    </Button>
                  ) : (
                    <Button
                      className="rounded-xl border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                      disabled={isSoldOut || isCartLoading}
                      onClick={() => addProductToCart(product)}
                      type="button"
                      variant="outline"
                    >
                      <ShoppingCartIcon className="h-4 w-4" />
                      {isSoldOut ? 'Sold Out' : 'Add to cart'}
                    </Button>
                  )}
                  <Button
                    aria-label="Remove from wishlist"
                    onClick={() => removeProduct(product.id)}
                    type="button"
                    variant="outline"
                  >
                    <Trash2Icon className="h-4 w-4" />
                    Remove
                  </Button>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
