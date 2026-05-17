import { cmsPageGutterClassName } from '@/utilities/cmsLayout'
import { cn } from '@/utilities/cn'
import React from 'react'

export default function CheckoutLoading() {
  return (
    <div className={cn(cmsPageGutterClassName, 'flex min-h-[90vh] flex-col pb-16')}>
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-10 pt-8 md:gap-12 md:pt-12">
        <div className="space-y-4">
          <div className="h-4 w-48 animate-pulse rounded-md bg-muted" />
          <div className="h-10 w-56 animate-pulse rounded-lg bg-muted sm:h-12 sm:w-72" />
          <div className="h-4 max-w-md animate-pulse rounded-md bg-muted" />
        </div>
        <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
          <div className="flex min-w-0 flex-1 flex-col gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                className="rounded-2xl border border-border bg-card p-6 shadow-sm"
                key={i}
              >
                <div className="mb-4 h-5 w-32 animate-pulse rounded-md bg-muted" />
                <div className="space-y-3">
                  <div className="h-10 w-full animate-pulse rounded-lg bg-muted" />
                  <div className="h-10 w-full animate-pulse rounded-lg bg-muted" />
                </div>
              </div>
            ))}
          </div>
          <div className="h-80 w-full shrink-0 animate-pulse rounded-2xl border border-border bg-muted/40 lg:w-80" />
        </div>
      </div>
    </div>
  )
}
