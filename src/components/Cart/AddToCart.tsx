'use client'

import { Button } from '@/components/ui/button'
import type { Product, Variant } from '@/payload-types'

import { useAnalyticsEvent } from '@/hooks/useAnalyticsEvent'
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
  const { trackEvent } = useAnalyticsEvent()
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
        void trackEvent({
          eventType: 'add_to_cart',
          metadata: {
            quantity: 1,
            variantId: selectedVariant?.id,
          },
          productId: product.id,
        })
        toast.success('Item added to cart.')
      })
    },
    [addItem, product, selectedVariant, trackEvent],
  )

  const disabledReason = useMemo<string | null>(() => {
    if (isLoading) return 'Updating cart…'

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
        if (existingQuantity >= (selectedVariant?.inventory || 0)) {
          return 'Maximum available quantity is already in your cart.'
        }
      } else if (existingQuantity >= (product.inventory || 0)) {
        return 'Maximum available quantity is already in your cart.'
      }
    }

    if (product.enableVariants) {
      if (!selectedVariant) {
        return 'Select a variant to add this item.'
      }

      if (selectedVariant.inventory === 0) {
        return 'This variant is out of stock.'
      }
    } else if (product.inventory === 0) {
      return 'This item is out of stock.'
    }

    return null
  }, [selectedVariant, cart?.items, isLoading, product])

  const disabled = disabledReason != null

  const buttonLabel =
    isLoading ? 'Adding…'
    : disabled && disabledReason ? disabledReason
    : 'Add To Cart'

  return (
    <Button
      aria-disabled={disabled || isLoading}
      aria-label={disabled && disabledReason ? disabledReason : 'Add to cart'}
      title={disabledReason ?? undefined}
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
      {buttonLabel}
    </Button>
  )
}
