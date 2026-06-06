'use client'

import type { Product } from '@/payload-types'
import { TopSellingProductsClient } from '@/blocks/TopSellingProducts/Component.client'
import React, { useEffect, useState } from 'react'

export function FrequentlyBoughtTogether({ productId }: { productId: number }) {
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    void fetch(`/api/products/${productId}/frequently-bought-together`, { credentials: 'include' })
      .then((res) => res.json())
      .then((body: { products?: Product[] }) => {
        setProducts(Array.isArray(body.products) ? body.products : [])
      })
      .catch(() => setProducts([]))
  }, [productId])

  if (!products.length) return null

  return (
    <section className="mt-10">
      <TopSellingProductsClient heading="Frequently bought together" products={products} />
    </section>
  )
}
