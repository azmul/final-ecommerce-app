'use client'

import type { Product } from '@/payload-types'
import type { ReactNode } from 'react'

import { Price } from '@/components/Price'
import { useProductPricing } from '@/components/product/useProductPricing'
import { cn } from '@/utilities/cn'

type Props = {
  product: Product
  className?: string
  size?: 'default' | 'large'
}

export function ProductPriceDisplay({ product, className, size = 'default' }: Props) {
  const {
    amount,
    discountedAmount,
    discountPercent,
    discountedHighest,
    discountedLowest,
    hasDiscount,
    hasVariants,
    highestAmount,
    lowestAmount,
    selectedVariant,
  } = useProductPricing(product)

  const priceClass =
    size === 'large' ?
      'text-2xl font-bold tracking-tight text-orange-500 sm:text-3xl'
    : 'text-base font-semibold text-orange-500 sm:text-lg'
  const strikeClass = 'text-sm text-muted-foreground line-through sm:text-base'

  if (selectedVariant) {
    return (
      <PriceWrap className={className}>
        {hasDiscount && amount > 0 ?
          <>
            <Price amount={discountedAmount} as="span" className={priceClass} />
            <Price amount={amount} as="span" className={strikeClass} />
            <DiscountBadge percent={discountPercent} />
          </>
        : <Price amount={amount} as="span" className={priceClass} />}
      </PriceWrap>
    )
  }

  if (hasVariants) {
    return (
      <PriceWrap className={className}>
        {hasDiscount ?
          <>
            <Price
              highestAmount={discountedHighest}
              lowestAmount={discountedLowest}
              as="span"
              className={priceClass}
            />
            <Price
              highestAmount={highestAmount}
              lowestAmount={lowestAmount}
              as="span"
              className={strikeClass}
            />
            <DiscountBadge percent={discountPercent} />
          </>
        : <Price highestAmount={highestAmount} lowestAmount={lowestAmount} as="span" className={priceClass} />}
      </PriceWrap>
    )
  }

  if (hasDiscount && amount > 0) {
    return (
      <PriceWrap className={className}>
        <Price amount={discountedAmount} as="span" className={priceClass} />
        <Price amount={amount} as="span" className={strikeClass} />
        <DiscountBadge percent={discountPercent} />
      </PriceWrap>
    )
  }

  return (
    <PriceWrap className={className}>
      <Price amount={amount} as="span" className={priceClass} />
    </PriceWrap>
  )
}

function DiscountBadge({ percent }: { percent: number }) {
  return (
    <span className="rounded-md bg-emerald-500 px-2 py-0.5 text-xs font-bold text-white">
      Save {percent}%
    </span>
  )
}

function PriceWrap({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('inline-flex max-w-full flex-wrap items-baseline gap-x-2 gap-y-1 font-mono', className)}>
      {children}
    </div>
  )
}
