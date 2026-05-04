'use client'

import type { Product } from '@/payload-types'

import { Button } from '@/components/ui/button'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CreditCard } from 'lucide-react'
import React, { useCallback } from 'react'

type Props = {
  product: Product
}

/** Mirrors TopSellingProducts buy-now: checkout for simple SKUs; PDP when variants exist. */
export function CompareBuyNowButton({ product }: Props) {
  const router = useRouter()
  const { addItem, isLoading } = useCart()

  const slug = typeof product.slug === 'string' ? product.slug.trim() : ''
  const href = slug ? `/products/${slug}` : '#'

  const inventory = product.inventory ?? 0
  const enableVariants = Boolean(product.enableVariants)

  const anyVariantInStock =
    product.variants?.docs?.some((v) => {
      if (!v || typeof v !== 'object') return false
      return (v.inventory ?? 0) > 0
    }) ?? false

  const isSoldOutSimple = !enableVariants && inventory <= 0
  const isSoldOutVariants = enableVariants && !anyVariantInStock

  const buyNow = useCallback(() => {
    if (!product.id || isSoldOutSimple) return
    void Promise.resolve(addItem({ product: product.id })).then(() => {
      router.push('/checkout')
    })
  }, [addItem, isSoldOutSimple, product.id, router])

  const simpleDisabled = !enableVariants && (!product.id || isSoldOutSimple || isLoading)

  if (enableVariants) {
    if (!slug || isSoldOutVariants) {
      return (
        <Button className="w-full gap-2 shadow-sm" disabled size="sm" type="button" variant="default">
          <CreditCard aria-hidden className="size-4 shrink-0 opacity-90" />
          {!slug ? 'Unavailable' : 'Out of stock'}
        </Button>
      )
    }

    return (
      <Button asChild className="w-full gap-2 shadow-sm" size="sm" variant="default">
        <Link href={href}>
          <CreditCard aria-hidden className="size-4 shrink-0 opacity-90" />
          Buy now
        </Link>
      </Button>
    )
  }

  return (
    <Button
      className="w-full gap-2 shadow-sm"
      disabled={simpleDisabled}
      onClick={buyNow}
      size="sm"
      type="button"
      variant="default"
    >
      <CreditCard aria-hidden className="size-4 shrink-0 opacity-90" />
      {isSoldOutSimple ? 'Out of stock' : 'Buy now'}
    </Button>
  )
}
