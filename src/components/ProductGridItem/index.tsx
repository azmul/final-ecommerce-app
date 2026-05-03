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
    <article className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-background p-3 shadow-sm transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-md sm:p-4">
      <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-2 sm:left-4 sm:top-4">
        {productBadge ? (
          <span className="rounded-md bg-primary px-3 py-1 text-sm font-semibold text-primary-foreground">
            {productBadge}
          </span>
        ) : null}
      </div>

      <WishlistButton
        className="absolute right-3 top-3 z-20 sm:right-4 sm:top-4"
        product={product}
      />

      <Link
        aria-label={title || 'View product'}
        className="group flex flex-1 flex-col"
        href={itemURL}
      >
        <div className="relative aspect-square w-full rounded-xl bg-muted/40 p-4 sm:p-6">
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

        <div className="mt-4 flex flex-1 flex-col gap-3">
          <h3 className="text-lg font-semibold leading-snug text-foreground transition group-hover:text-primary sm:text-xl">
            {title}
          </h3>

          <div className="inline-flex flex-wrap items-baseline gap-x-2 gap-y-0">
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
                className="text-sm font-medium text-muted-foreground line-through sm:text-base"
              />
            ) : null}

            {hasDiscount ? (
              <span className="text-xs font-bold text-primary sm:text-sm">Save {discountPercent}%</span>
            ) : null}
          </div>
        </div>
      </Link>

      <div className="mt-5">
        {product.enableVariants ? (
          <Link
            className="flex h-12 w-full items-center justify-center rounded-xl border border-primary px-4 text-sm font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground sm:text-base"
            href={itemURL}
          >
            Choose Options
          </Link>
        ) : quantity > 0 && existingItem?.id ? (
          <div className="grid min-h-12 grid-cols-[minmax(3rem,5rem)_1fr_minmax(3rem,5rem)] overflow-hidden rounded-xl border border-primary sm:h-12">
            <button
              aria-label="Reduce item quantity"
              className="flex items-center justify-center bg-primary text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isLoading}
              onClick={() => decrementItem(existingItem.id)}
              type="button"
            >
              <MinusIcon className="h-5 w-5" />
            </button>
            <span className="flex items-center justify-center text-lg font-bold">{quantity}</span>
            <button
              aria-label="Increase item quantity"
              className="flex items-center justify-center bg-primary text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
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
            className="flex min-h-12 touch-manipulation w-full items-center justify-center gap-2 rounded-xl border border-primary px-4 py-3 text-sm font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground active:opacity-90 disabled:pointer-events-none disabled:opacity-60 sm:text-base sm:py-2"
            disabled={!canAddSimpleProduct || isSoldOut || isLoading}
            onClick={addProductToCart}
            type="button"
          >
            <ShoppingCartIcon className="h-5 w-5" />
            {isSoldOut ? 'Stock Out' : 'Add To Cart'}
          </button>
        )}
      </div>
    </article>
  )
}
