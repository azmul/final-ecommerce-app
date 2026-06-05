'use client'

import type { Product } from '@/payload-types'
import { useRecentlyViewed } from '@/providers/RecentlyViewed'
import { TopSellingProductsClient } from '@/blocks/TopSellingProducts/Component.client'
import React, { useEffect, useState } from 'react'

export function RecentlyViewedCarousel({ excludeProductId }: { excludeProductId?: number }) {
  const { productIds } = useRecentlyViewed()
  const [products, setProducts] = useState<Product[]>([])

  const ids = productIds
    .map(Number)
    .filter((id) => Number.isFinite(id) && id !== excludeProductId)
    .slice(0, 8)

  useEffect(() => {
    if (!ids.length) {
      setProducts([])
      return
    }

    void fetch(`/api/products/by-ids?ids=${ids.join(',')}`, { credentials: 'include' })
      .then((res) => res.json())
      .then((body: { products?: Product[] }) => {
        const list = Array.isArray(body.products) ? body.products : []
        const byId = new Map(list.map((p) => [p.id, p]))
        setProducts(ids.flatMap((id) => {
          const doc = byId.get(id)
          return doc ? [doc] : []
        }))
      })
      .catch(() => setProducts([]))
  }, [ids.join(',')])

  if (!products.length) return null

  return (
    <section className="mt-10">
      <TopSellingProductsClient heading="Recently viewed" products={products} />
    </section>
  )
}
