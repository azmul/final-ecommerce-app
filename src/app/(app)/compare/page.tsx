import { ComparePageClient } from '@/components/compare/ComparePageClient'
import { Button } from '@/components/ui/button'
import { cmsPageGutterClassName } from '@/utilities/cmsLayout'
import { cn } from '@/utilities/cn'
import { parseCompareIdsParam } from '@/utilities/compareSelection'
import configPromise from '@payload-config'
import { noindexMetadata } from '@/lib/seo/noindexMetadata'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from 'payload'
import React from 'react'

import type { Product } from '@/payload-types'

export const metadata: Metadata = noindexMetadata({
  description:
    'Compare up to three products side by side: pricing, discounts, availability, summaries, descriptions from the catalog, and technical specs.',
  title: 'Compare products',
})

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>
}) {
  const { ids: idsRaw } = await searchParams
  const parsedIds = parseCompareIdsParam(idsRaw)

  if (parsedIds.length < 2) {
    return (
      <div className={cnWrap}>
        <CompareEmptyState singleSelected={parsedIds.length === 1} />
      </div>
    )
  }

  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'products',
    depth: 2,
    draft: false,
    limit: 3,
    overrideAccess: false,
    pagination: false,
    where: {
      and: [{ id: { in: parsedIds } }, { _status: { equals: 'published' } }],
    },
    populate: {
      variants: {
        inventory: true,
        priceInBDT: true,
      },
      categories: {
        slug: true,
        title: true,
      },
      subcategories: {
        title: true,
      },
      brands: {
        slug: true,
        title: true,
      },
    },
  })

  const byId = new Map(result.docs.map((doc) => [doc.id, doc]))
  const ordered = parsedIds.map((id) => byId.get(id)).filter((doc): doc is Product => Boolean(doc))

  if (ordered.length < 2) {
    return (
      <div className={cnWrap}>
        <ComparePartialMatch requestedCount={parsedIds.length} matchedCount={ordered.length} />
      </div>
    )
  }

  const columnIds = ordered.map((p) => p.id)

  return (
    <div className={cnWrap}>
      <ComparePageClient columnIds={columnIds} products={ordered} />
    </div>
  )
}

const cnWrap = cn(cmsPageGutterClassName, 'pb-28 pt-8 sm:pt-12')

function CompareEmptyState({ singleSelected }: { singleSelected: boolean }) {
  return (
    <div className="mx-auto max-w-lg space-y-6 rounded-2xl border border-border bg-muted/15 p-8 dark:bg-muted/10">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Compare products</h1>
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
          <p>
            {singleSelected
              ? 'You’ve only selected one product. Add one or two more using Compare on the shop or product page (maximum three).'
              : 'Choose two or three products to see them side by side. Use the Compare checkbox on product cards or on any product page.'}
          </p>
          <p className="text-xs sm:text-sm">
            When you open a comparison, you’ll see pricing (including discounts), stock status,
            categories, SEO summaries, short excerpts from each product description, optional badges,
            and any technical specs defined in the CMS.
          </p>
        </div>
      </div>
      <Button asChild>
        <Link href="/shop">Browse all products</Link>
      </Button>
    </div>
  )
}

function ComparePartialMatch({
  matchedCount,
  requestedCount,
}: {
  matchedCount: number
  requestedCount: number
}) {
  return (
    <div className="mx-auto max-w-lg space-y-6 rounded-2xl border border-border bg-muted/15 p-8 dark:bg-muted/10">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Compare products</h1>
        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
          We couldn’t load enough published products for this comparison ({matchedCount} of{' '}
          {requestedCount} found). They may be unpublished or removed. Adjust your selection and try
          again.
        </p>
      </div>
      <Button asChild variant="outline">
        <Link href="/shop">Back to shop</Link>
      </Button>
    </div>
  )
}
