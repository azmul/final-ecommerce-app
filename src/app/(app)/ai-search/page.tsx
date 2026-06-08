import { AiSearchExperience } from '@/components/ai-search/AiSearchExperience'
import { cmsPageGutterClassName } from '@/utilities/cmsLayout'
import type { Metadata } from 'next'
import React, { Suspense } from 'react'

export const metadata: Metadata = {
  description:
    'AI-powered product search with smart recommendations, semantic matching, help articles, and visual search.',
  title: 'AI Search',
}

function AiSearchFallback() {
  return (
    <div className={`${cmsPageGutterClassName} py-16 text-center text-muted-foreground`}>
      Loading AI search…
    </div>
  )
}

export default function AiSearchPage() {
  return (
    <Suspense fallback={<AiSearchFallback />}>
      <AiSearchExperience />
    </Suspense>
  )
}
