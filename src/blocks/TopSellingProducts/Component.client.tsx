import type { Product } from '@/payload-types'

import { TopSellingProductCard } from '@/blocks/TopSellingProducts/TopSellingProductCard'
import { cmsBlockShellClassName } from '@/utilities/cmsLayout'
import { cn } from '@/utilities/cn'
import React from 'react'

type Props = {
  heading: string
  products: Partial<Product>[]
}

export function TopSellingProductsClient({ heading, products }: Props) {
  if (!products.length) return null

  return (
    <section aria-labelledby="top-selling-products-heading" className={cn(cmsBlockShellClassName)}>
      <h2
        className="mb-7 text-center text-lg font-bold tracking-tight text-foreground sm:mb-10 sm:text-xl md:text-2xl lg:mb-12"
        id="top-selling-products-heading"
      >
        {heading}
      </h2>
      <ul className="grid w-full gap-4 sm:grid-cols-2 sm:gap-5 md:gap-6 lg:gap-6 xl:grid-cols-3 xl:gap-8">
        {products.map((product, index) =>
          product.id ? (
            <li key={product.id}>
              <TopSellingProductCard priority={index < 3} product={product} />
            </li>
          ) : null,
        )}
      </ul>
    </section>
  )
}
