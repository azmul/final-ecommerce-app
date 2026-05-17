import type { TrustStatsBlock as TrustStatsBlockProps } from '@/payload-types'

import { cmsBlockShellClassName } from '@/utilities/cmsLayout'
import { cn } from '@/utilities/cn'
import React from 'react'

const variantShell: Record<NonNullable<TrustStatsBlockProps['variant']>, string> = {
  gradient:
    'rounded-2xl border border-primary/15 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-6 py-8 sm:px-10 sm:py-10',
  bordered:
    'rounded-2xl border border-border bg-card px-6 py-8 shadow-sm sm:px-10 sm:py-10',
  minimal: 'px-2 py-4 sm:px-4',
}

export const TrustStatsBlock: React.FC<TrustStatsBlockProps> = (props) => {
  const items = (props.items ?? []).flatMap((item) => {
    if (!item?.value?.trim() || !item.label?.trim()) return []
    return [{ value: item.value.trim(), label: item.label.trim() }]
  })

  if (items.length < 2) return null

  const variant = props.variant ?? 'gradient'

  return (
    <section
      aria-label="Store highlights"
      className={cn(cmsBlockShellClassName, 'py-2 sm:py-4')}
    >
      <div className={variantShell[variant]}>
        <ul
          className={cn(
            'grid gap-6 text-center',
            items.length === 2 && 'grid-cols-2',
            items.length === 3 && 'grid-cols-1 sm:grid-cols-3',
            items.length >= 4 && 'grid-cols-2 lg:grid-cols-4',
          )}
        >
          {items.map((item, index) => (
            <li
              className={cn(
                'relative flex flex-col items-center gap-1',
                variant === 'bordered' &&
                  index > 0 &&
                  'sm:before:absolute sm:before:-left-3 sm:before:top-1/2 sm:before:h-12 sm:before:w-px sm:before:-translate-y-1/2 sm:before:bg-border',
              )}
              key={`${item.value}-${index}`}
            >
              <span className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
                {item.value}
              </span>
              <span className="text-sm font-medium text-muted-foreground sm:text-base">
                {item.label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
