import type { Product } from '@/payload-types'

import { ProductGeoSection } from '@/components/product/ProductGeoSection'
import { ProductOverviewDetails } from '@/components/product/ProductOverview'

type ProductDetailsTabContentProps = {
  product: Product
}

/** Full product copy for the Details tab — description, specs, and GEO content. */
export function ProductDetailsTabContent({ product }: ProductDetailsTabContentProps) {
  return (
    <div className="flex min-w-0 flex-col gap-8">
      <ProductOverviewDetails product={product} inTab />
      <ProductGeoSection embedded product={product} />
    </div>
  )
}
