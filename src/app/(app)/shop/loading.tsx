import { Grid } from '@/components/Grid'
import React from 'react'

function ProductSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="aspect-square w-full animate-pulse rounded-xl bg-muted" />
      <div className="mt-4 space-y-3">
        <div className="h-5 w-3/4 animate-pulse rounded-md bg-muted" />
        <div className="h-5 w-1/3 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="mt-5 h-12 w-full animate-pulse rounded-lg bg-muted" />
    </div>
  )
}

export default function Loading() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between sm:pb-6">
        <div className="space-y-2">
          <div className="h-8 w-40 animate-pulse rounded-lg bg-muted sm:h-9 sm:w-48" />
          <div className="h-4 w-56 animate-pulse rounded-md bg-muted sm:w-64" />
        </div>
        <div className="h-8 w-24 animate-pulse rounded-full bg-muted" />
      </div>
      <Grid className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <ProductSkeleton key={index} />
        ))}
      </Grid>
    </div>
  )
}
