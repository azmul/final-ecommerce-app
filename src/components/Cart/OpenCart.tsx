import { Button, type ButtonProps } from '@/components/ui/button'
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
      variant="outline"
      size="icon"
      aria-label={
        count > 0 ? `Open cart, ${count} ${count === 1 ? 'item' : 'items'}` : 'Open cart'
      }
      className={cn(
        'group relative h-10 w-10 shrink-0 rounded-xl border-2 border-border bg-background text-foreground shadow-sm',
        'transition-[transform,box-shadow,color,background-color,border-color] motion-safe:duration-200 motion-safe:ease-[cubic-bezier(0.33,1,0.68,1)]',
        'motion-safe:hover:border-primary/50 motion-safe:hover:bg-muted/50 motion-safe:hover:shadow-md',
        'motion-safe:active:scale-[0.94]',
        className,
      )}
      {...rest}
    >
      <ShoppingBag
        aria-hidden
        className="size-4.5 text-foreground motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:scale-105"
        strokeWidth={2}
      />
      {badgeLabel ? (
        <span
          key={badgeLabel}
          aria-hidden
          className={cn(
            'absolute -right-1 -top-1 flex h-5 min-w-5 translate-x-px -translate-y-px items-center justify-center rounded-full',
            'bg-primary px-1 text-[10px] font-semibold leading-none tabular-nums text-primary-foreground',
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
