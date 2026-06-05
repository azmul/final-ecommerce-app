'use client'

import type { Product } from '@/payload-types'
import { TopSellingProductsClient } from '@/blocks/TopSellingProducts/Component.client'
import React, { useEffect, useState } from 'react'

export function SimilarProductsCarousel({ productId }: { productId: number }) {
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    void fetch(`/api/products/${productId}/similar`, { credentials: 'include' })
      .then((res) => res.json())
      .then((body: { products?: Product[] }) => {
        setProducts(Array.isArray(body.products) ? body.products : [])
      })
      .catch(() => setProducts([]))
  }, [productId])

  if (!products.length) return null

  return (
    <section className="mt-10">
      <TopSellingProductsClient heading="Similar products" products={products} />
    </section>
  )
}
