import { cmsPageGutterClassName } from '@/utilities/cmsLayout'
import { cn } from '@/utilities/cn'
import React from 'react'

export default function AccountLoading() {
  return (
    <div className={cn(cmsPageGutterClassName, 'mt-8 flex flex-col gap-6 pb-8 md:flex-row md:gap-8')}>
      <div className="flex gap-2 md:hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div className="h-9 w-24 shrink-0 animate-pulse rounded-full bg-muted" key={i} />
        ))}
      </div>
      <div className="hidden w-48 shrink-0 flex-col gap-3 md:flex">
        {Array.from({ length: 5 }).map((_, i) => (
          <div className="h-5 w-full animate-pulse rounded-md bg-muted" key={i} />
        ))}
      </div>
      <div className="flex min-w-0 grow flex-col gap-6">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border bg-muted/20 px-6 py-5 sm:px-8">
            <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
            <div className="mt-2 h-4 w-64 animate-pulse rounded-md bg-muted" />
          </div>
          <div className="space-y-4 p-6 sm:p-8">
            <div className="h-24 w-full animate-pulse rounded-xl bg-muted/50" />
            <div className="h-24 w-full animate-pulse rounded-xl bg-muted/50" />
          </div>
        </div>
      </div>
    </div>
  )
}
