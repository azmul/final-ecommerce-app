import type { Metadata } from 'next'

import { WishlistItems } from '@/components/WishlistItems'
import { cmsPageGutterClassName } from '@/utilities/cmsLayout'
import { cn } from '@/utilities/cn'

export const metadata: Metadata = {
  description: 'View products saved to your wishlist.',
  title: 'Wishlist',
}

export default function WishlistPage() {
  return (
    <div className={cn(cmsPageGutterClassName, 'py-8')}>
      <div className="mb-6 space-y-2 border-b border-border pb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Wishlist
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
          Keep track of products you want to revisit, compare, or add to your cart later.
        </p>
      </div>
      <WishlistItems />
    </div>
  )
}
