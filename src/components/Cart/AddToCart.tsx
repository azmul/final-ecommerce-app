'use client'

import { Button } from '@/components/ui/button'
import type { Product, Variant } from '@/payload-types'

import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import clsx from 'clsx'
import { useSearchParams } from 'next/navigation'
import React, { useCallback, useMemo } from 'react'
import { ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'
type Props = {
  product: Product
  buttonClassName?: string
}

export function AddToCart({ product, buttonClassName }: Props) {
  const { addItem, cart, isLoading } = useCart()
  const searchParams = useSearchParams()

  const variants =
    product.variants?.docs?.filter(
      (variant): variant is Variant => Boolean(variant && typeof variant === 'object'),
    ) || []

  const selectedVariant = useMemo<Variant | undefined>(() => {
    if (product.enableVariants && variants.length) {
      const variantId = searchParams.get('variant')

      const validVariant = variants.find((variant) => {
        return String(variant.id) === variantId
      })

      if (validVariant) {
        return validVariant
      }
    }

    return undefined
  }, [product.enableVariants, searchParams, variants])

  const addToCart = useCallback(
    (e: React.FormEvent<HTMLButtonElement>) => {
      e.preventDefault()

      addItem({
        product: product.id,
        variant: selectedVariant?.id ?? undefined,
      }).then(() => {
        toast.success('Item added to cart.')
      })
    },
    [addItem, product, selectedVariant],
  )

  const disabled = useMemo<boolean>(() => {
    const existingItem = cart?.items?.find((item) => {
      const productID = typeof item.product === 'object' ? item.product?.id : item.product
      const variantID = item.variant
        ? typeof item.variant === 'object'
          ? item.variant?.id
          : item.variant
        : undefined

      if (productID === product.id) {
        if (product.enableVariants) {
          return variantID === selectedVariant?.id
        }
        return true
      }
    })

    if (existingItem) {
      const existingQuantity = existingItem.quantity

      if (product.enableVariants) {
        return existingQuantity >= (selectedVariant?.inventory || 0)
      }
      return existingQuantity >= (product.inventory || 0)
    }

    if (product.enableVariants) {
      if (!selectedVariant) {
        return true
      }

      if (selectedVariant.inventory === 0) {
        return true
      }
    } else {
      if (product.inventory === 0) {
        return true
      }
    }

    return false
  }, [selectedVariant, cart?.items, product])

  return (
    <Button
      aria-label="Add to cart"
      variant={'outline'}
      className={clsx(
        'min-h-12 w-full touch-manipulation px-6 text-base font-semibold sm:w-auto sm:min-w-[12.5rem]',
        buttonClassName,
      )}
      disabled={disabled || isLoading}
      onClick={addToCart}
      type="submit"
    >
      <ShoppingCart className="size-5" aria-hidden />
      Add To Cart
    </Button>
  )
}
