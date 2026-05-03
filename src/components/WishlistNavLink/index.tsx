'use client'

import { HeartIcon } from 'lucide-react'
import Link from 'next/link'

import { useWishlist } from '@/providers/Wishlist'

export function WishlistNavLink() {
  const { count } = useWishlist()

  return (
    <Link
      aria-label={count > 0 ? `Wishlist with ${count} items` : 'Wishlist'}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border-2 border-border bg-background text-foreground shadow-sm transition-[color,box-shadow,background-color,border-color] hover:border-primary/50 hover:bg-muted/50 hover:text-primary hover:shadow-md"
      href="/wishlist"
    >
      <HeartIcon className="h-5 w-5" strokeWidth={2} />
      {count > 0 ? (
        <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-semibold text-primary-foreground">
          {count}
        </span>
      ) : null}
    </Link>
  )
}
