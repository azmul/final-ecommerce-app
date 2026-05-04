'use client'

import type { Product } from '@/payload-types'

import Link from 'next/link'
import React, { useCallback, useMemo } from 'react'
import clsx from 'clsx'
import { Media } from '@/components/Media'
import { Price } from '@/components/Price'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { MinusIcon, PlusIcon, ShoppingCartIcon } from 'lucide-react'
import { toast } from 'sonner'
import { CompareCheckbox } from '@/components/compare/CompareCheckbox'
import { WishlistButton } from '@/components/WishlistButton'

type Props = {
  product: Partial<Product>
  /** First visible grid item: pass true so LCP image loads eagerly (Next.js `priority`). */
  priority?: boolean
}

export const ProductGridItem: React.FC<Props> = ({ product, priority = false }) => {
  const { gallery, priceInBDT, title } = product
  const { addItem, cart, decrementItem, incrementItem, isLoading } = useCart()

  let price = priceInBDT

  const variants = product.variants?.docs

  if (variants && variants.length > 0) {
    const variant = variants[0]
    if (
      variant &&
      typeof variant === 'object' &&
      variant?.priceInBDT &&
      typeof variant.priceInBDT === 'number'
    ) {
      price = variant.priceInBDT
    }
  }

  const image =
    gallery?.[0]?.image && typeof gallery[0]?.image !== 'string' ? gallery[0]?.image : false

  const itemURL = product.slug ? `/products/${product.slug}` : '#'
  const mainPrice = typeof price === 'number' ? price : undefined
  const discountFromField =
    typeof product.discountPercentage === 'number' ? Math.round(product.discountPercentage) : 0
  const discountPercent = Math.min(Math.max(discountFromField, 0), 100)
  const hasDiscount = discountPercent > 0
  const discountedPrice =
    typeof mainPrice === 'number' && hasDiscount
      ? Math.round(mainPrice * (100 - discountPercent)) / 100
      : mainPrice
  const productBadge =
    typeof product.productBadge === 'string' ? product.productBadge.trim() : undefined

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
  const canAddSimpleProduct = Boolean(product.id) && !product.enableVariants
  const inventory = product.inventory ?? 0
  const isSoldOut = !product.enableVariants && inventory <= 0
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
    <article className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-sm transition-[box-shadow,transform,border-color] hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md">
      <div className="relative flex flex-1 flex-col p-3 sm:p-4">
        <div className="pointer-events-none absolute left-3 top-3 z-10 flex max-w-[calc(100%-4rem)] flex-wrap gap-2 sm:left-4 sm:top-4">
          {productBadge ? (
            <span className="pointer-events-none rounded-md bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground shadow-sm sm:px-3 sm:text-sm">
              {productBadge}
            </span>
          ) : null}
        </div>

        <WishlistButton
          className="absolute right-3 top-3 z-20 size-10 shrink-0 shadow-md ring-1 ring-border/60 sm:right-4 sm:top-4"
          product={product}
        />

        <Link
          aria-label={title || 'View product'}
          className="group flex min-h-0 flex-1 flex-col outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-xl"
          href={itemURL}
        >
          <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-muted/35 ring-1 ring-border/40 dark:bg-muted/25">
            {image ? (
              <Media
                className="relative h-full w-full"
                fill
                imgClassName={clsx('object-contain transition duration-300 ease-in-out', {
                  'group-hover:scale-105': true,
                })}
                priority={priority}
                resource={image}
              />
            ) : null}
          </div>

          <div className="mt-3 flex flex-1 flex-col gap-2 sm:mt-4 sm:gap-3">
            <h3 className="line-clamp-2 text-base font-semibold leading-snug text-foreground transition group-hover:text-primary sm:text-lg">
              {title}
            </h3>

            <div className="inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              {typeof discountedPrice === 'number' ? (
                <Price
                  amount={discountedPrice}
                  as="span"
                  className="text-base font-bold text-primary sm:text-lg"
                />
              ) : null}

              {hasDiscount && typeof mainPrice === 'number' ? (
                <Price
                  amount={mainPrice}
                  as="span"
                  className="text-xs font-medium text-muted-foreground line-through sm:text-sm"
                />
              ) : null}

              {hasDiscount ? (
                <span className="text-[11px] font-bold uppercase tracking-wide text-primary sm:text-xs">
                  Save {discountPercent}%
                </span>
              ) : null}
            </div>
          </div>
        </Link>

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
                aria-label={isSoldOut ? 'Stock out' : 'Add to cart'}
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
      </div>
    </article>
  )
}
