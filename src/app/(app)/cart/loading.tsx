import { cmsPageGutterClassName } from '@/utilities/cmsLayout'
import { cn } from '@/utilities/cn'
import React from 'react'

export default function CartLoading() {
  return (
    <div className={cn(cmsPageGutterClassName, 'py-8 sm:py-10 lg:py-12')}>
      <div className="mx-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="space-y-3 border-b border-border bg-muted/25 px-6 py-7 sm:px-8">
          <div className="h-3 w-12 animate-pulse rounded bg-muted" />
          <div className="h-8 w-40 animate-pulse rounded-lg bg-muted" />
          <div className="h-4 w-64 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="space-y-4 p-4 sm:p-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div className="flex gap-3 rounded-xl border border-border p-3" key={i}>
              <div className="size-[4.75rem] shrink-0 animate-pulse rounded-lg bg-muted" />
              <div className="flex flex-1 flex-col gap-2">
                <div className="h-5 w-3/4 animate-pulse rounded-md bg-muted" />
                <div className="h-4 w-1/2 animate-pulse rounded-md bg-muted" />
                <div className="mt-auto h-9 w-28 animate-pulse rounded-lg bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
