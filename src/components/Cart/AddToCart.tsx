'use client'

import { Button } from '@/components/ui/button'
import type { Product, Variant } from '@/payload-types'

import { useAnalyticsEvent } from '@/hooks/useAnalyticsEvent'
import { toMetaCustomDataFromProduct, resolveProductCategory } from '@/lib/analytics/meta/productContent'
import { resolveProductPricing } from '@/lib/ecommerce/resolveProductPricing'
import { useCart } from '@payloadcms/plugin-ecommerce/client/react'
import clsx from 'clsx'
import { AnimatePresence, m } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import { Check, Loader2, ShoppingBag, ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { flyToCart } from '@/lib/motion/flyToCart'

function resolveProductImageSrc(product: Product): string | null {
  const image = product.gallery?.[0]?.image
  if (image && typeof image === 'object' && typeof image.url === 'string') {
    return image.url
  }
  return null
}
type Props = {
  product: Product
  buttonClassName?: string
  icon?: 'cart' | 'bag'
  quantity?: number
}

export function AddToCart({ product, buttonClassName, icon = 'cart', quantity = 1 }: Props) {
  const { trackEvent } = useAnalyticsEvent()
  const { addItem, cart, isLoading } = useCart()
  const searchParams = useSearchParams()
  const reduced = usePrefersReducedMotion()
  const [justAdded, setJustAdded] = useState(false)
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const imageSrc = useMemo(() => resolveProductImageSrc(product), [product])

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

      const fromRect = e.currentTarget.getBoundingClientRect()

      addItem(
        {
          product: product.id,
          variant: selectedVariant?.id ?? undefined,
        },
        quantity,
      ).then(() => {
        if (!reduced) {
          flyToCart({ imageSrc, from: fromRect })
        }
        setJustAdded(true)
        if (successTimer.current) clearTimeout(successTimer.current)
        successTimer.current = setTimeout(() => setJustAdded(false), 1400)

        const variants =
          product.variants?.docs?.filter(
            (variant): variant is Variant => Boolean(variant && typeof variant === 'object'),
          ) || []
        const pricing = resolveProductPricing(product, variants)
        const price =
          typeof selectedVariant?.priceInBDT === 'number' ? selectedVariant.priceInBDT
          : pricing.saleLow ?? pricing.listLow ?? product.priceInBDT ?? null

        void trackEvent({
          customData: toMetaCustomDataFromProduct({
            category: resolveProductCategory(product.categories),
            currency: 'BDT',
            id: product.id,
            price,
            quantity,
            slug: product.slug,
            title: product.title,
          }),
          eventType: 'add_to_cart',
          metadata: {
            quantity,
            variantId: selectedVariant?.id,
          },
          productId: product.id,
        })
        toast.success('Item added to cart.')
      })
    },
    [addItem, imageSrc, product, quantity, reduced, selectedVariant, trackEvent],
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

  const isOutOfStock =
    (product.enableVariants && selectedVariant && selectedVariant.inventory === 0) ||
    (!product.enableVariants && product.inventory === 0)

  const buttonLabel =
    isLoading ? 'Adding…'
    : isOutOfStock ? 'Out of Stock'
    : 'Add To Cart'

  const Icon = icon === 'bag' ? ShoppingBag : ShoppingCart

  return (
    <Button
      aria-disabled={disabled || isLoading}
      aria-label={disabled && disabledReason ? disabledReason : 'Add to cart'}
      title={disabledReason ?? undefined}
      variant={'outline'}
      className={clsx(
        'min-h-12 w-full touch-manipulation px-6 text-sm font-semibold tracking-wide uppercase transition-all duration-300 sm:w-auto sm:min-w-[12.5rem] flex items-center justify-center gap-2',
        buttonClassName,
      )}
      disabled={disabled || isLoading}
      onClick={addToCart}
      type="submit"
    >
      <AnimatePresence mode="wait" initial={false}>
        {justAdded && !isLoading ? (
          <m.span
            key="added"
            className="flex items-center gap-2"
            initial={reduced ? false : { scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={reduced ? undefined : { scale: 0.6, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <Check className="size-4 shrink-0" aria-hidden />
            <span>Added</span>
          </m.span>
        ) : (
          <m.span
            key="default"
            className="flex items-center gap-2"
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.18 }}
          >
            {isLoading ? (
              <Loader2 className="size-4 animate-spin shrink-0" aria-hidden />
            ) : (
              <Icon className="size-4 shrink-0" aria-hidden />
            )}
            <span>{buttonLabel}</span>
          </m.span>
        )}
      </AnimatePresence>
    </Button>
  )
}
