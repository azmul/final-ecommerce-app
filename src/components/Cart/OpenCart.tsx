import { Button, type ButtonProps } from '@/components/ui/button'
import {
  CHAT_LAUNCHER_SURFACE_CLASS,
  CHAT_THEME_CLASS,
  CHAT_UNREAD_BADGE_CLASS,
} from '@/components/chat/chatTheme'
import { cn } from '@/utilities/cn'
import { ShoppingBag } from 'lucide-react'
import React from 'react'

export function OpenCartButton({
  className,
  quantity,
  ...rest
}: Omit<ButtonProps, 'variant' | 'size' | 'children'> & {
  quantity?: number
}) {
  const count = quantity && quantity > 0 ? quantity : 0
  const badgeLabel = count > 99 ? '99+' : count > 0 ? String(count) : null

  return (
    <Button
      variant="ghost"
      size="clear"
      aria-label={
        count > 0 ? `Open cart, ${count} ${count === 1 ? 'item' : 'items'}` : 'Open cart'
      }
      className={cn(
        CHAT_THEME_CLASS,
        CHAT_LAUNCHER_SURFACE_CLASS,
        'group relative h-10 w-10 shrink-0 rounded-xl border-0',
        'transition-[transform,box-shadow] motion-safe:duration-200 motion-safe:ease-[cubic-bezier(0.33,1,0.68,1)]',
        'motion-safe:hover:shadow-lg motion-safe:hover:shadow-primary/35',
        'motion-safe:active:scale-[0.94]',
        className,
      )}
      {...rest}
    >
      <ShoppingBag
        aria-hidden
        className="size-4.5 text-white motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:scale-105"
        strokeWidth={2}
      />
      {badgeLabel ? (
        <span
          key={badgeLabel}
          aria-hidden
          className={cn(
            CHAT_UNREAD_BADGE_CLASS,
            'absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center px-1 text-[10px] leading-none tabular-nums',
            'motion-safe:animate-in motion-safe:zoom-in-[0.88] motion-safe:fade-in-0 motion-safe:duration-380 motion-safe:ease-[cubic-bezier(0.34,1.56,0.64,1)]',
            badgeLabel.length > 1 ? 'min-w-5.5' : '',
          )}
        >
          {badgeLabel}
        </span>
      ) : null}
    </Button>
  )
}
