import { Categories } from '@/components/layout/search/Categories'
import { cmsPageGutterClassName } from '@/utilities/cmsLayout'
import { cn } from '@/utilities/cn'
import React, { Suspense } from 'react'

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <div className={cn(cmsPageGutterClassName, 'py-8 sm:py-10 lg:py-12')}>
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10 xl:gap-12">
          <div className="flex w-full shrink-0 flex-col gap-3 lg:sticky lg:top-24 lg:w-56 xl:w-64">
            <aside className="w-full rounded-2xl border border-border p-4 shadow-sm sm:p-5">
              <Categories />
            </aside>
          </div>
          <div className="min-h-[50vh] min-w-0 flex-1">{children}</div>
        </div>
      </div>
    </Suspense>
  )
}
