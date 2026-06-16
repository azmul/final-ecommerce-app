'use client'

import { MetaPixelPageViewTracker } from '@/components/analytics/MetaPixelPageViewTracker'
import { Suspense } from 'react'

export function MetaPixelProvider() {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim()
  if (!pixelId) return null

  return (
    <Suspense fallback={null}>
      <MetaPixelPageViewTracker />
    </Suspense>
  )
}
