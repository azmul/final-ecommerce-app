'use client'

import { CountdownPromoClient } from '@/blocks/CountdownPromo/Component.client'
import { queueStateUpdate } from '@/hooks/queueStateUpdate'
import type { Product } from '@/payload-types'
import React from 'react'

type Props = {
  product: Product
}

export function ProductFlashSaleCountdown({ product }: Props) {
  const endDate = product.flashSaleEndDate
  const endMs = endDate ? new Date(endDate).getTime() : NaN
  const [isActive, setIsActive] = React.useState(() => Number.isFinite(endMs))

  React.useEffect(() => {
    if (!Number.isFinite(endMs)) {
      queueStateUpdate(() => setIsActive(false))
      return
    }
    if (endMs <= Date.now()) {
      queueStateUpdate(() => setIsActive(false))
    }
  }, [endMs])

  if (!endDate || !isActive) return null

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
