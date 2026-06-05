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
}

export function ChatProductResults({ className, products }: Props) {
  if (!products.length) return null

  return (
    <div className={cn('mt-2 space-y-2', className)}>
      {products.map((product) => (
        <ChatProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}

function ChatProductCard({ product }: { product: AiProductResult }) {
  const { addItem, cart, isLoading } = useCart()
  const [adding, setAdding] = useState(false)

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
          return variantId === product.variantId
        }
        return true
      })?.quantity ?? 0
    )
  }, [cart?.items, product.enableVariants, product.id, product.variantId])

  const canAddToCart = product.inStock && (!product.enableVariants || Boolean(product.variantId))

  const handleAddToCart = async () => {
    if (!canAddToCart) return

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

  const displayPrice = product.salePrice ?? product.price

  return (
    <article className="flex gap-2 rounded-md border bg-background p-2">
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

        <div className="mt-1 flex items-center gap-2">
          {displayPrice != null ? (
            <Price amount={displayPrice} as="span" className="text-xs font-semibold" />
          ) : (
            <span className="text-xs text-muted-foreground">Price on page</span>
          )}
          {!product.inStock ? (
            <span className="text-[10px] font-medium text-destructive">Out of stock</span>
          ) : null}
        </div>

        {product.whyItMatches ? (
          <p className="mt-1 line-clamp-2 text-[10px] text-muted-foreground">{product.whyItMatches}</p>
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
