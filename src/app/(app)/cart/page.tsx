import type { Metadata } from 'next'

import { CartPageView } from '@/components/Cart/CartPageView'
import { cmsPageGutterClassName } from '@/utilities/cmsLayout'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { cn } from '@/utilities/cn'

export default function CartPage() {
  return (
    <div className={cn(cmsPageGutterClassName, 'py-8 sm:py-10 lg:py-12')}>
      <CartPageView />
    </div>
  )
}

export const metadata: Metadata = {
  description: 'Review items in your cart before checkout.',
  openGraph: mergeOpenGraph({
    title: 'Cart',
    url: '/cart',
  }),
  title: 'Cart',
}
