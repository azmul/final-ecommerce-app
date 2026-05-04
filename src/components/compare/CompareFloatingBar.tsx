'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/utilities/cn'
import { useCompare } from '@/providers/Compare'
import Link from 'next/link'
import { GitCompareArrows, XIcon } from 'lucide-react'
import React from 'react'

export function CompareFloatingBar() {
  const { clear, count, selectedIds } = useCompare()

  if (count < 1) return null

  const idsQuery = selectedIds.map(String).join(',')
  const compareHref = `/compare?ids=${idsQuery}`
  const ready = count >= 2

  return (
    <div
      aria-live="polite"
      className={cn(
        'fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-1/2 z-40 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-wrap items-center justify-center gap-2 rounded-2xl border border-border bg-background/95 px-4 py-3 shadow-lg backdrop-blur-md supports-[backdrop-filter]:bg-background/85 dark:border-border sm:gap-3 sm:px-5',
      )}
      role="status"
    >
      <span className="flex items-center gap-2 text-sm font-medium text-foreground">
        <GitCompareArrows aria-hidden className="size-4 shrink-0 text-primary" strokeWidth={2} />
        <span>
          {count} {count === 1 ? 'product' : 'products'} for compare
          {!ready ? <span className="text-muted-foreground"> · pick at least 2</span> : null}
        </span>
      </span>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {ready ? (
          <Button asChild size="sm">
            <Link href={compareHref}>View comparison</Link>
          </Button>
        ) : (
          <Button disabled size="sm" variant="secondary" type="button">
            Compare
          </Button>
        )}
        <Button
          aria-label="Clear compare selection"
          className="shrink-0"
          onClick={() => clear()}
          size="sm"
          type="button"
          variant="outline"
        >
          <XIcon aria-hidden className="size-4" strokeWidth={2} />
          <span className="sr-only sm:not-sr-only sm:ml-1">Clear</span>
        </Button>
      </div>
    </div>
  )
}
