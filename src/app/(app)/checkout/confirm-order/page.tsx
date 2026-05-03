import type { Metadata } from 'next'

import { ConfirmOrder } from '@/components/checkout/ConfirmOrder'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { cmsPageGutterClassName } from '@/utilities/cmsLayout'
import { cn } from '@/utilities/cn'
import React, { Suspense } from 'react'

function ConfirmOrderFallback() {
  return (
    <div className="flex w-full flex-col items-center justify-start gap-4 text-center">
      <h1 className="text-2xl">Confirming Order</h1>
      <div className="h-6 w-12 animate-pulse rounded bg-muted" aria-hidden />
    </div>
  )
}

export default function ConfirmOrderPage() {
  return (
    <div className={cn(cmsPageGutterClassName, 'flex min-h-[90vh] py-12')}>
      <Suspense fallback={<ConfirmOrderFallback />}>
        <ConfirmOrder />
      </Suspense>
    </div>
  )
}

export const metadata: Metadata = {
  description: 'Confirm order.',
  openGraph: mergeOpenGraph({
    title: 'Confirming order',
    url: '/checkout/confirm-order',
  }),
  title: 'Confirming order',
}
