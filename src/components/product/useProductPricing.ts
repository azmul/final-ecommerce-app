'use client'

import type { Product, Variant } from '@/payload-types'
import { useCurrency } from '@payloadcms/plugin-ecommerce/client/react'
import { useMemo } from 'react'

import { useSelectedVariant } from '@/components/product/useSelectedVariant'

export type ProductPricing = {
  amount: number
  discountedAmount: number
  discountPercent: number
  hasDiscount: boolean
  hasVariants: boolean
  lowestAmount: number
  highestAmount: number
  discountedLowest: number
  discountedHighest: number
  selectedVariant: Variant | undefined
}

export function useProductPricing(product: Product): ProductPricing {
  const { currency } = useCurrency()
  const selectedVariant = useSelectedVariant(product)
  const priceField = `priceIn${currency.code}` as keyof Product
  const hasVariants = Boolean(product.enableVariants && product.variants?.docs?.length)

  const discountFromField =
    typeof product.discountPercentage === 'number' ? Math.round(product.discountPercentage) : 0
  const discountPercent = Math.min(Math.max(discountFromField, 0), 100)
  const hasDiscount = discountPercent > 0

  return useMemo(() => {
    let amount = 0
    let lowestAmount = 0
    let highestAmount = 0

    if (selectedVariant) {
      const variantPriceField = `priceIn${currency.code}` as keyof Variant
      const variantPrice = selectedVariant[variantPriceField]
      if (typeof variantPrice === 'number') {
        amount = variantPrice
      }
    } else if (hasVariants) {
      const variantPriceField = `priceIn${currency.code}` as keyof Variant
      const variantsOrderedByPrice =
        product.variants?.docs
          ?.filter((variant): variant is Variant => Boolean(variant && typeof variant === 'object'))
          .sort((a, b) => {
            const aPrice = a[variantPriceField]
            const bPrice = b[variantPriceField]
            if (typeof aPrice === 'number' && typeof bPrice === 'number') {
              return aPrice - bPrice
            }
            return 0
          }) ?? []

      if (variantsOrderedByPrice.length) {
        const lowestVariant = variantsOrderedByPrice[0][variantPriceField]
        const highestVariant =
          variantsOrderedByPrice[variantsOrderedByPrice.length - 1][variantPriceField]

        if (typeof lowestVariant === 'number' && typeof highestVariant === 'number') {
          lowestAmount = lowestVariant
          highestAmount = highestVariant
        }
      }
    } else if (product[priceField] && typeof product[priceField] === 'number') {
      amount = product[priceField]
    }

    const applyDiscount = (value: number) =>
      hasDiscount ? Math.round(value * (100 - discountPercent)) / 100 : value

    return {
      amount,
      discountedAmount: applyDiscount(amount),
      discountPercent,
      discountedHighest: applyDiscount(highestAmount),
      discountedLowest: applyDiscount(lowestAmount),
      hasDiscount,
      hasVariants,
      highestAmount,
      lowestAmount,
      selectedVariant,
    }
  }, [
    currency.code,
    discountPercent,
    hasDiscount,
    hasVariants,
    priceField,
    product,
    selectedVariant,
  ])
}
