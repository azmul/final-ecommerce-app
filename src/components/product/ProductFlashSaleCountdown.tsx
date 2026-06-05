'use client'

import { CountdownPromoClient } from '@/blocks/CountdownPromo/Component.client'
import type { Product } from '@/payload-types'
import React from 'react'

type Props = {
  product: Product
}

export function ProductFlashSaleCountdown({ product }: Props) {
  const endDate = product.flashSaleEndDate
  if (!endDate) return null

  const endMs = new Date(endDate).getTime()
  if (!Number.isFinite(endMs) || endMs <= Date.now()) return null

  return (
    <div>
      <CountdownPromoClient
        ctaLabel="Add to cart below"
        ctaUrl="#purchase"
        description="This flash sale price ends soon."
        endDate={endDate}
        eyebrow="Flash sale"
        headline={product.title ? `${product.title} — limited time` : 'Limited-time offer'}
        promoCode={product.flashSalePromoCode ?? undefined}
        theme="vibrant"
      />
    </div>
  )
}
