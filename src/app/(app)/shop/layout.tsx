import { cmsPageGutterClassName } from '@/utilities/cmsLayout'
import { cn } from '@/utilities/cn'
import React, { Suspense } from 'react'

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <div className={cn(cmsPageGutterClassName, 'py-8 sm:py-10 lg:py-12')}>{children}</div>
    </Suspense>
  )
}
