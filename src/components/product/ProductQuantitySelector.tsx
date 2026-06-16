'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/utilities/cn'
import { Minus, Plus } from 'lucide-react'
import { useId } from 'react'

type Props = {
  className?: string
  disabled?: boolean
  max?: number
  min?: number
  onChange: (value: number) => void
  value: number
}

export function ProductQuantitySelector({
  className,
  disabled = false,
  max = 99,
  min = 1,
  onChange,
  value,
}: Props) {
  const labelId = useId()

  const decrement = () => onChange(Math.max(min, value - 1))
  const increment = () => onChange(Math.min(max, value + 1))

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <span className="text-sm font-medium text-foreground" id={labelId}>
        Quantity:
      </span>
      <div
        aria-labelledby={labelId}
        className="inline-flex w-fit items-stretch overflow-hidden rounded-lg border border-border bg-background"
        role="group"
      >
        <Button
          aria-label="Decrease quantity"
          className="h-10 w-10 shrink-0 rounded-none border-0 shadow-none"
          disabled={disabled || value <= min}
          onClick={decrement}
          size="icon"
          type="button"
          variant="ghost"
        >
          <Minus aria-hidden className="size-4" />
        </Button>
        <span
          aria-live="polite"
          className="flex min-w-12 items-center justify-center border-x border-border px-3 text-base font-semibold tabular-nums text-foreground"
        >
          {value}
        </span>
        <Button
          aria-label="Increase quantity"
          className="h-10 w-10 shrink-0 rounded-none border-0 shadow-none"
          disabled={disabled || value >= max}
          onClick={increment}
          size="icon"
          type="button"
          variant="ghost"
        >
          <Plus aria-hidden className="size-4" />
        </Button>
      </div>
    </div>
  )
}
