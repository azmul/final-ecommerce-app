'use client'

import { Star } from 'lucide-react'

import { cn } from '@/utilities/cn'

type StarRatingProps = {
  className?: string
  label?: string
  max?: number
  onChange?: (value: number) => void
  readOnly?: boolean
  size?: 'sm' | 'md'
  value: number
}

export function StarRating({
  className,
  label = 'Rating',
  max = 5,
  onChange,
  readOnly = false,
  size = 'md',
  value,
}: StarRatingProps) {
  const starClass = size === 'sm' ? 'size-4' : 'size-5'

  return (
    <div
      aria-label={label}
      className={cn('inline-flex flex-wrap items-center gap-0.5', className)}
      role={readOnly ? 'img' : 'group'}
    >
      {Array.from({ length: max }, (_, i) => {
        const starNumber = i + 1
        const filled = value >= starNumber - 0.25

        if (readOnly) {
          return (
            <Star
              key={starNumber}
              aria-hidden
              className={cn(
                starClass,
                'shrink-0 transition-colors',
                filled ?
                  'fill-amber-400 text-amber-400'
                : 'text-muted-foreground/55 dark:text-muted-foreground/65',
              )}
              strokeWidth={1.65}
            />
          )
        }

        return (
          <button
            className={cn(
              '-m-0.5 cursor-pointer rounded-full p-0.5 outline-none ring-offset-background transition-colors hover:bg-muted/80 focus-visible:ring-2 focus-visible:ring-ring',
            )}
            key={starNumber}
            type="button"
            aria-label={`${starNumber} ${starNumber === 1 ? 'star' : 'stars'}`}
            aria-pressed={value === starNumber}
            onClick={() => onChange?.(starNumber)}
          >
            <Star
              aria-hidden
              className={cn(
                starClass,
                'shrink-0 transition-colors',
                filled ?
                  'fill-amber-400 text-amber-400'
                : 'text-muted-foreground/55 dark:text-muted-foreground/65',
              )}
              strokeWidth={1.65}
            />
          </button>
        )
      })}
    </div>
  )
}

export function averageToStarDisplay(value: number | null | undefined): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0
  return Math.min(5, Math.max(0, value))
}
