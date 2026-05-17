'use client'

import type { Product, Variant } from '@/payload-types'
import { useSearchParams } from 'next/navigation'
import { useMemo } from 'react'

export function useProductVariants(product: Product) {
  return useMemo(
    () =>
      product.variants?.docs?.filter(
        (variant): variant is Variant => Boolean(variant && typeof variant === 'object'),
      ) ?? [],
    [product.variants?.docs],
  )
}

export function useSelectedVariant(product: Product) {
  const searchParams = useSearchParams()
  const variants = useProductVariants(product)

  return useMemo<Variant | undefined>(() => {
    if (!product.enableVariants || !variants.length) return undefined

    const variantId = searchParams.get('variant')
    return variants.find((variant) => String(variant.id) === variantId)
  }, [product.enableVariants, searchParams, variants])
}
