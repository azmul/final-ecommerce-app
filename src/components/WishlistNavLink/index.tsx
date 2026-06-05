'use client'

import {
  CHAT_LAUNCHER_SURFACE_CLASS,
  CHAT_THEME_CLASS,
  CHAT_UNREAD_BADGE_CLASS,
} from '@/components/chat/chatTheme'
import { cn } from '@/utilities/cn'
import { HeartIcon } from 'lucide-react'
import Link from 'next/link'

import { useWishlist } from '@/providers/Wishlist'

export function WishlistNavLink() {
  const { count } = useWishlist()

  return (
    <Link
      aria-label={count > 0 ? `Wishlist with ${count} items` : 'Wishlist'}
      className={cn(
        CHAT_THEME_CLASS,
        CHAT_LAUNCHER_SURFACE_CLASS,
        'relative inline-flex h-10 w-10 items-center justify-center rounded-xl border-0 transition-[box-shadow] hover:shadow-lg hover:shadow-primary/35',
      )}
      href="/wishlist"
    >
      <HeartIcon className="size-5 text-white" strokeWidth={2} />
      {count > 0 ? (
        <span
          className={cn(
            CHAT_UNREAD_BADGE_CLASS,
            'absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center px-1 text-[10px] leading-none',
            count > 9 ? 'min-w-5.5' : '',
          )}
        >
          {count > 99 ? '99+' : count}
        </span>
      ) : null}
    </Link>
  )
}
