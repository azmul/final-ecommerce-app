'use client'

import { Price } from '@/components/Price'
import { Button } from '@/components/ui/button'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { ArrowRight, ShoppingBag } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React, { useMemo } from 'react'

import { DeleteItemButton } from './DeleteItemButton'
import { EditItemQuantityButton } from './EditItemQuantityButton'
import type { Product, VariantOption } from '@/payload-types'
import { SHOP_BASE_PATH } from '@/utilities/shopPath'

type ProductGalleryRow = NonNullable<Product['gallery']>[number]

type Props = {
  /** Called when navigating away (e.g. close cart sheet). */
  onNavigate?: () => void
  variant?: 'sheet' | 'page'
}

export function CartContents({ onNavigate, variant = 'sheet' }: Props) {
  const { cart } = useCart()
  const isPage = variant === 'page'

  const isEmpty = !cart?.items?.length

  if (isEmpty) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-8 py-14 text-center">
        <div
          aria-hidden
          className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/70 text-muted-foreground"
        >
          <ShoppingBag aria-hidden className="h-6 w-6" strokeWidth={1.5} />
        </div>
        <p className="text-lg font-medium text-foreground">Your cart is empty</p>
        <p className="mt-2 max-w-[18rem] text-sm leading-relaxed text-muted-foreground">
          Explore the shop and tap add to cart when something catches your eye.
        </p>
        <Button asChild size="lg" className="group mt-8 gap-2 shadow-none">
          <Link href={SHOP_BASE_PATH} onClick={onNavigate}>
            Browse the shop
            <ArrowRight aria-hidden className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 [-webkit-overflow-scrolling:touch]">
        <ul className="flex flex-col gap-3">
          {cart?.items?.map((item, i) => {
            const product = item.product
            const variant = item.variant

            if (typeof product !== 'object' || !item || !product || !product.slug)
              return <React.Fragment key={`skip-${String(i)}`} />

            const metaImage =
              product.meta?.image && typeof product.meta?.image === 'object'
                ? product.meta.image
                : undefined

            const firstGalleryImage =
              typeof product.gallery?.[0]?.image === 'object'
                ? product.gallery?.[0]?.image
                : undefined

            let image = firstGalleryImage || metaImage
            let price = product.priceInBDT

            const isVariant = Boolean(variant) && typeof variant === 'object'

            if (isVariant) {
              price = variant?.priceInBDT

              const imageVariant = product.gallery?.find((row: ProductGalleryRow) => {
                if (!row.variantOption) return false
                const variantOptionID =
                  typeof row.variantOption === 'object'
                    ? row.variantOption.id
                    : row.variantOption

                const hasMatch = variant?.options?.some((option: number | VariantOption) => {
                  if (typeof option === 'object') return option.id === variantOptionID
                  return option === variantOptionID
                })

                return hasMatch
              })

              if (imageVariant && typeof imageVariant.image === 'object') {
                image = imageVariant.image
              }
            }

            const rowKey = item.id ?? `cart-line-${String(i)}`
            const productSlug = (item.product as Product)?.slug

            return (
              <li key={rowKey}>
                <div className="relative rounded-xl border border-border bg-linear-to-br from-card to-muted/15 p-3 shadow-sm ring-1 ring-border/60">
                  <div className="absolute right-3 top-3 z-[1]">
                    <DeleteItemButton item={item} />
                  </div>

                  <div className="flex gap-3 pr-10">
                    <Link
                      className="relative h-[4.75rem] w-[4.75rem] shrink-0 overflow-hidden rounded-lg border border-border bg-muted/50"
                      href={`/products/${productSlug}`}
                      onClick={onNavigate}
                    >
                      {image?.url ? (
                        <Image
                          alt={image.alt || product.title || ''}
                          className="h-full w-full object-cover transition-transform hover:scale-[1.03]"
                          height={152}
                          src={image.url}
                          width={152}
                        />
                      ) : null}
                    </Link>

                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <Link
                        href={`/products/${productSlug}`}
                        onClick={onNavigate}
                        className="pr-8"
                      >
                        <span className="line-clamp-2 font-medium leading-snug text-foreground underline-offset-2 hover:underline">
                          {product.title}
                        </span>
                      </Link>

                      {isVariant && variant ? (
                        <p className="text-xs capitalize text-muted-foreground">
                          {variant.options
                            ?.map((option: number | VariantOption) =>
                              typeof option === 'object' ? option.label : null,
                            )
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      ) : null}

                      <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-1">
                        <div className="inline-flex items-center rounded-lg border border-border bg-background/90 p-0.5 shadow-xs">
                          <EditItemQuantityButton item={item} type="minus" />
                          <p className="min-w-[1.75rem] text-center text-sm font-medium leading-none tabular-nums">
                            <span suppressHydrationWarning>{item.quantity}</span>
                          </p>
                          <EditItemQuantityButton item={item} type="plus" />
                        </div>

                        {typeof price === 'number' ? (
                          <Price
                            amount={price}
                            className="text-right text-sm font-medium text-foreground"
                            as="span"
                          />
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="shrink-0 border-t border-border bg-muted/20 px-5 py-5">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <span className="text-sm font-medium text-muted-foreground">Subtotal</span>
          {typeof cart?.subtotal === 'number' ? (
            <Price
              amount={cart.subtotal}
              className="text-lg font-semibold tabular-nums text-foreground"
              as="span"
            />
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          )}
        </div>
        <p className="mb-5 text-[11px] leading-relaxed text-muted-foreground">
          Shipping and taxes are calculated at checkout.
        </p>
        <Button asChild size="lg" className="group w-full gap-2 shadow-none">
          <Link href="/checkout" onClick={onNavigate}>
            Proceed to checkout
            <ArrowRight aria-hidden className="h-4 w-4" />
          </Link>
        </Button>
        <div className="mt-4 flex flex-col gap-2 text-center">
          {!isPage ? (
            <Link
              href="/cart"
              onClick={onNavigate}
              className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              View full cart page
            </Link>
          ) : null}
          <Link
            href={SHOP_BASE_PATH}
            onClick={onNavigate}
            className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    </>
  )
}

/** Summary line for cart headers (sheet + page). */
export function useCartSummary() {
  const { cart } = useCart()

  return useMemo(() => {
    const itemTotalQty =
      cart?.items?.reduce((qty, item) => (item.quantity ?? 0) + qty, 0) ?? 0
    const isEmpty = !cart?.items?.length
    return { itemTotalQty, isEmpty }
  }, [cart])
}
