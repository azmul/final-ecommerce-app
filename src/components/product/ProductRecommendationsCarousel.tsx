'use client'

import type { Product } from '@/payload-types'
import { TopSellingProductsClient } from '@/blocks/TopSellingProducts/Component.client'
import React, { useEffect, useState } from 'react'

type Props = {
  context: 'homepage' | 'pdp' | 'cart'
  heading?: string
  productId?: number
}

export function ProductRecommendationsCarousel({
  context,
  heading = 'Recommended for you',
  productId,
}: Props) {
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    const params = new URLSearchParams({ context, limit: '8' })
    if (productId) params.set('productId', String(productId))

    void fetch(`/api/recommendations?${params.toString()}`, { credentials: 'include' })
      .then((res) => res.json())
      .then((body: { products?: Product[] }) => {
        setProducts(Array.isArray(body.products) ? body.products : [])
      })
      .catch(() => setProducts([]))
  }, [context, productId])

  if (!products.length) return null

  return (
    <section className="mt-10">
      <TopSellingProductsClient heading={heading} products={products} />
    </section>
  )
}
