'use client'

import type { Product } from '@/payload-types'

import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { cn } from '@/utilities/cn'
import { useCompare } from '@/providers/Compare'
import React, { useCallback, useId } from 'react'

type Props = {
  productId: Product['id'] | undefined
  /** PDP / forms — bordered control */
  variant?: 'card' | 'detail'
  /**
   * Grid cards: tight row without heavy chrome (`minimal`).
   * Omit or `default` for the bordered PDP-style control.
   */
  appearance?: 'default' | 'minimal'
}

export function CompareCheckbox({
  productId,
  variant = 'card',
  appearance = 'default',
}: Props) {
  const compareFieldId = useId()
  const { isSelected, toggle } = useCompare()

  const checked = isSelected(productId)

  const onCheckedChange = useCallback(() => {
    if (!productId) return
    void toggle(productId)
  }, [productId, toggle])

  if (!productId) return null

  const isDetail = variant === 'detail'
  const isMinimalGrid = appearance === 'minimal' && variant === 'card'

  if (isMinimalGrid) {
    return (
      <div
        className={cn(
          'flex w-full max-w-full items-center justify-center gap-2 rounded-lg px-2 py-2 transition-colors',
          'text-muted-foreground hover:bg-muted/45 hover:text-foreground',
          checked && 'bg-primary/8 text-primary hover:bg-primary/12 hover:text-primary',
        )}
      >
        <Checkbox
          aria-labelledby={`${compareFieldId}-label`}
          checked={checked}
          className="size-4 shrink-0 border-muted-foreground/35 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
          id={`${compareFieldId}-compare`}
          onCheckedChange={onCheckedChange}
        />
        <Label
          className={cn(
            'cursor-pointer font-sans text-xs font-medium normal-case tracking-normal text-current peer-disabled:cursor-not-allowed peer-disabled:opacity-70 sm:text-[13px]',
          )}
          htmlFor={`${compareFieldId}-compare`}
          id={`${compareFieldId}-label`}
        >
          Compare
        </Label>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-xl border border-border/80 bg-muted/15 px-3 py-2 shadow-xs backdrop-blur-sm dark:bg-muted/25',
        isDetail && 'sm:px-4 sm:py-2.5',
      )}
    >
      <Checkbox
        aria-labelledby={`${compareFieldId}-label`}
        checked={checked}
        className={cn(isDetail && 'size-[18px]')}
        id={`${compareFieldId}-compare`}
        onCheckedChange={onCheckedChange}
      />
      <Label
        className={cn(
          'cursor-pointer font-sans text-sm font-medium normal-case tracking-normal text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
          isDetail && 'text-base',
        )}
        htmlFor={`${compareFieldId}-compare`}
        id={`${compareFieldId}-label`}
      >
        Compare
      </Label>
    </div>
  )
}
