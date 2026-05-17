import { Grid } from '@/components/Grid'
import React from 'react'

export function ProductCardSkeleton() {
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

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <Grid className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </Grid>
  )
}
