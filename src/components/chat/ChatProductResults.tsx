'use client'

import type { AiProductResult } from '@/lib/ai/types'
import { Price } from '@/components/Price'
import { Button } from '@/components/ui/button'
import { cn } from '@/utilities/cn'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import { ExternalLink, ShoppingCart } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React, { useMemo, useState } from 'react'
import { toast } from 'sonner'

type Props = {
  products: AiProductResult[]
  className?: string
  animate?: boolean
}

export function ChatProductResults({ animate = false, className, products }: Props) {
  if (!products.length) return null

  const cheapest = products.find((product) => product.inStock) ?? null

  return (
    <div className={cn('space-y-2', className)}>
      {cheapest ? <QuickAddCheapest product={cheapest} /> : null}
      {products.map((product, index) => (
        <ChatProductCard animate={animate} index={index} key={product.id} product={product} />
      ))}
    </div>
  )
}

function QuickAddCheapest({ product }: { product: AiProductResult }) {
  const { addItem, isLoading } = useCart()
  const [adding, setAdding] = useState(false)

  const handleQuickAdd = async () => {
    setAdding(true)
    try {
      await addItem({
        product: product.id,
        variant: product.variantId ?? undefined,
      })
      toast.success(`${product.title} added to cart`)
    } catch {
      toast.error('Could not add this item to cart')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/20 bg-primary/5 px-2.5 py-2">
      <p className="text-[11px] text-muted-foreground">
        Quick action: add best-priced in-stock option.
      </p>
      <Button
        className="h-7 px-2 text-[11px]"
        disabled={adding || isLoading}
        onClick={() => void handleQuickAdd()}
        size="sm"
        type="button"
      >
        <ShoppingCart className="mr-1 size-3" />
        Add cheapest
      </Button>
    </div>
  )
}

function ChatProductCard({
  animate = false,
  index = 0,
  product,
}: {
  animate?: boolean
  index?: number
  product: AiProductResult
}) {
  const { addItem, cart, isLoading } = useCart()
  const [adding, setAdding] = useState(false)
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(product.variantId)

  const activeVariantId = product.enableVariants ? selectedVariantId : null
  const selectedVariant = useMemo(
    () =>
      product.variantsSummary?.find((variant) => variant.id === activeVariantId) ??
      product.variantsSummary?.[0],
    [activeVariantId, product.variantsSummary],
  )

  const existingQuantity = useMemo(() => {
    return (
      cart?.items?.find((item) => {
        const productId = typeof item.product === 'object' ? item.product?.id : item.product
        const variantId = item.variant
          ? typeof item.variant === 'object'
            ? item.variant?.id
            : item.variant
          : undefined

        if (productId !== product.id) return false
        if (product.enableVariants) {
          return variantId === activeVariantId
        }
        return true
      })?.quantity ?? 0
    )
  }, [activeVariantId, cart?.items, product.enableVariants, product.id])

  const canAddToCart = product.inStock && (!product.enableVariants || Boolean(activeVariantId))

  const handleAddToCart = async () => {
    if (!canAddToCart) return

    setAdding(true)
    try {
      await addItem({
        product: product.id,
        variant: activeVariantId ?? undefined,
      })
      toast.success(`${product.title} added to cart`)
    } catch {
      toast.error('Could not add this item to cart')
    } finally {
      setAdding(false)
    }
  }

  return (
    <article
      className={cn(
        'group flex gap-2.5 rounded-xl border border-border/80 bg-background/95 p-2.5 shadow-sm transition-shadow hover:shadow-md',
        animate &&
          'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 motion-safe:fill-mode-both motion-safe:duration-500 motion-safe:ease-out',
      )}
      style={animate ? { animationDelay: `${120 + index * 90}ms` } : undefined}
    >
      <Link
        className="relative size-14 shrink-0 overflow-hidden rounded-md bg-muted"
        href={`/products/${product.slug}`}
      >
        {product.imageUrl ? (
          <Image
            alt={product.title}
            className="object-cover"
            fill
            sizes="56px"
            src={product.imageUrl}
          />
        ) : (
          <span className="flex size-full items-center justify-center text-[10px] text-muted-foreground">
            No image
          </span>
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <Link
          className="line-clamp-2 text-xs font-medium hover:underline"
          href={`/products/${product.slug}`}
        >
          {product.title}
        </Link>

        {product.brand ? (
          <p className="text-[10px] text-muted-foreground">{product.brand}</p>
        ) : null}

        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <ChatProductPrice product={product} />
          {!product.inStock ? (
            <span className="text-[10px] font-medium text-destructive">Out of stock</span>
          ) : null}
        </div>

        {product.whyItMatches ? (
          <p className="mt-1 line-clamp-2 text-[10px] text-muted-foreground">{product.whyItMatches}</p>
        ) : null}

        {product.enableVariants && product.variantsSummary?.length ? (
          <div className="mt-2 space-y-1">
            <label className="text-[10px] font-medium text-muted-foreground" htmlFor={`variant-${product.id}`}>
              Choose variant
            </label>
            <select
              className="h-7 w-full rounded-md border bg-background px-2 text-[11px]"
              id={`variant-${product.id}`}
              onChange={(event) => setSelectedVariantId(Number(event.target.value))}
              value={selectedVariant?.id ?? ''}
            >
              {product.variantsSummary.map((variant) => (
                <option key={variant.id} value={variant.id}>
                  {variant.label}
                </option>
              ))}
            </select>
            {selectedVariant?.salePrice != null ? (
              <div className="text-[10px] text-muted-foreground">
                Selected: <Price amount={selectedVariant.salePrice} as="span" className="font-semibold text-foreground" />
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-2 flex flex-wrap gap-1.5">
          {canAddToCart ? (
            <Button
              className="h-7 px-2 text-[11px]"
              disabled={adding || isLoading}
              onClick={() => void handleAddToCart()}
              size="sm"
              type="button"
            >
              <ShoppingCart className="mr-1 size-3" />
              {existingQuantity > 0 ? `Add again (${existingQuantity})` : 'Add to cart'}
            </Button>
          ) : product.enableVariants && product.inStock ? (
            <Button asChild className="h-7 px-2 text-[11px]" size="sm" variant="outline">
              <Link href={`/products/${product.slug}`}>
                <ExternalLink className="mr-1 size-3" />
                Choose options
              </Link>
            </Button>
          ) : null}

          <Button asChild className="h-7 px-2 text-[11px]" size="sm" variant="ghost">
            <Link href={`/products/${product.slug}`}>View</Link>
          </Button>
        </div>
      </div>
    </article>
  )
}

function ChatProductPrice({ product }: { product: AiProductResult }) {
  const discountFromField =
    typeof product.discountPercentage === 'number' ? Math.round(product.discountPercentage) : 0
  const discountPercent = Math.min(Math.max(discountFromField, 0), 100)
  const hasDiscount = discountPercent > 0

  const listLow = product.price
  const listHigh = product.priceHigh ?? product.price
  const saleLow = product.salePrice ?? product.price
  const saleHigh = product.salePriceHigh ?? product.salePrice ?? product.price

  const isRange =
    product.enableVariants &&
    listLow != null &&
    listHigh != null &&
    listLow !== listHigh

  if (listLow == null && saleLow == null) {
    return <span className="text-xs text-muted-foreground">Price on page</span>
  }

  const strikeClass = 'text-[10px] text-muted-foreground line-through'

  if (isRange) {
    return (
      <div className="inline-flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 font-mono">
        {hasDiscount && saleLow != null && saleHigh != null ? (
          <>
            <Price
              as="span"
              className="text-xs font-semibold text-foreground"
              highestAmount={saleHigh}
              lowestAmount={saleLow}
            />
            <Price
              as="span"
              className={strikeClass}
              highestAmount={listHigh}
              lowestAmount={listLow}
            />
            <span className="rounded bg-primary/15 px-1 py-0.5 text-[10px] font-bold text-primary">
              −{discountPercent}%
            </span>
          </>
        ) : (
          <Price
            as="span"
            className="text-xs font-semibold text-foreground"
            highestAmount={listHigh}
            lowestAmount={listLow}
          />
        )}
      </div>
    )
  }

  const listAmount = listLow ?? saleLow
  const saleAmount = saleLow ?? listLow

  if (listAmount == null) {
    return <span className="text-xs text-muted-foreground">Price on page</span>
  }

  if (hasDiscount && saleAmount != null && listAmount > 0) {
    return (
      <div className="inline-flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 font-mono">
        <Price amount={saleAmount} as="span" className="text-xs font-semibold text-foreground" />
        <Price amount={listAmount} as="span" className={strikeClass} />
        <span className="rounded bg-primary/15 px-1 py-0.5 text-[10px] font-bold text-primary">
          −{discountPercent}%
        </span>
      </div>
    )
  }

  return <Price amount={listAmount} as="span" className="text-xs font-semibold text-foreground" />
}
