'use client'

import type { Product } from '@/payload-types'

import { AddToCart } from '@/components/Cart/AddToCart'
import { Media } from '@/components/Media'
import { Price } from '@/components/Price'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PRODUCT_CARD_IMAGE_SIZES } from '@/lib/seo/imageSizes'
import Link from 'next/link'
import React from 'react'

type Props = {
  onOpenChange: (open: boolean) => void
  open: boolean
  product: Partial<Product>
}

function resolvePrice(product: Partial<Product>) {
  const variants = product.variants?.docs
  if (variants?.length) {
    const variant = variants[0]
    if (variant && typeof variant === 'object' && typeof variant.priceInBDT === 'number') {
      return variant.priceInBDT
    }
  }
  return typeof product.priceInBDT === 'number' ? product.priceInBDT : undefined
}

export function ProductQuickViewModal({ onOpenChange, open, product }: Props) {
  const image =
    product.gallery?.[0]?.image && typeof product.gallery[0].image !== 'string' ?
      product.gallery[0].image
    : null
  const itemURL = product.slug ? `/products/${product.slug}` : '/shop'
  const price = resolvePrice(product)
  const hasVariants = Boolean(product.enableVariants)

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="line-clamp-2 pr-6 text-left">{product.title}</DialogTitle>
          <DialogDescription className="sr-only">Quick view product details</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-xl bg-muted/30 ring-1 ring-border/50">
            {image ?
              <Media
                className="relative h-full w-full"
                fill
                imgClassName="object-contain"
                resource={image}
                size={PRODUCT_CARD_IMAGE_SIZES}
              />
            : null}
          </div>

          {typeof price === 'number' ?
            <Price amount={price} as="p" className="text-lg font-bold text-primary" />
          : null}

          <div className="flex flex-col gap-2 sm:flex-row">
            {hasVariants ?
              <Button asChild className="flex-1">
                <Link href={itemURL}>Choose options</Link>
              </Button>
            : product.id ?
              <AddToCart buttonClassName="flex-1 w-full" product={product as Product} />
            : null}
            <Button asChild className="flex-1" variant="outline">
              <Link href={itemURL}>View full details</Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
