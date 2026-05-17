import { cmsPageGutterClassName } from '@/utilities/cmsLayout'
import { cn } from '@/utilities/cn'
import React from 'react'

export default function ProductLoading() {
  return (
    <div
      className={cn(
        cmsPageGutterClassName,
        'relative overflow-x-hidden pt-5 pb-14 sm:pb-24 sm:pt-7 lg:pt-8',
      )}
    >
      <div className="relative mx-auto w-full min-w-0 max-w-6xl space-y-10">
        <div className="h-10 w-36 animate-pulse rounded-lg bg-muted" />
        <div className="w-full overflow-hidden rounded-2xl border border-border bg-background p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
            <div className="mx-auto aspect-square w-full max-w-lg animate-pulse rounded-2xl bg-muted/60 lg:max-w-[440px]" />
            <div className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4">
              <div className="h-8 w-4/5 animate-pulse rounded-lg bg-muted" />
              <div className="h-6 w-24 animate-pulse rounded-md bg-muted" />
              <div className="h-10 w-32 animate-pulse rounded-full bg-muted" />
              <div className="mt-4 h-12 w-full animate-pulse rounded-lg bg-muted" />
              <div className="h-24 w-full animate-pulse rounded-xl bg-muted/60" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
