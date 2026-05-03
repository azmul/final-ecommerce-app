'use client'
import { Product, Variant } from '@/payload-types'
import { useSearchParams } from 'next/navigation'
import { useMemo } from 'react'

type Props = {
  product: Product
}

export const StockIndicator: React.FC<Props> = ({ product }) => {
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

  const stockQuantity = useMemo(() => {
    if (product.enableVariants) {
      if (selectedVariant) {
        return selectedVariant.inventory || 0
      }
    }
    return product.inventory || 0
  }, [product.enableVariants, selectedVariant, product.inventory])

  if (product.enableVariants && !selectedVariant) {
    return (
      <div
        className="rounded-xl border border-border/80 bg-muted/30 px-3 py-2.5 text-sm text-muted-foreground"
        role="status"
      >
        <p className="font-medium text-foreground">Select options</p>
        <p className="mt-0.5 text-xs leading-relaxed">Choose a variant above to see availability.</p>
      </div>
    )
  }

  const inStock = stockQuantity > 0
  const lowStock = inStock && stockQuantity < 10

  return (
    <div role="status" className="flex min-h-12 flex-col justify-center gap-1">
      {inStock && lowStock && (
        <p className="rounded-lg border border-warning/40 bg-warning/15 px-3 py-2 text-sm font-semibold text-foreground">
          Only {stockQuantity} left in stock
        </p>
      )}
      {inStock && !lowStock && (
        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">In stock</p>
      )}
      {!inStock && <p className="text-sm font-semibold text-destructive">Out of stock</p>}
    </div>
  )
}
