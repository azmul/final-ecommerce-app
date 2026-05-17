import { ShopPageView } from '@/app/(app)/shop/ShopPageView'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import React from 'react'

import { parseShopSearchParams } from '@/lib/search/parseShopSearchParams'
import { taxonomyMetadata } from '@/lib/seo/taxonomyMetadata'
import { shopListingMetadata } from '@/utilities/shopListingSeo'

type SearchParams = { [key: string]: string | string[] | undefined }

type Props = {
  params: Promise<{ categorySlug: string }>
  searchParams: Promise<SearchParams>
}

function legacyCategoryId(param: string | string[] | undefined): string | undefined {
  if (typeof param === 'string') return param
  if (Array.isArray(param)) return param[0]
  return undefined
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { categorySlug } = await params
  const resolved = await searchParams
  const payload = await getPayload({ config: configPromise })
  const found = await payload.find({
    collection: 'categories',
    depth: 1,
    limit: 1,
    select: { title: true, meta: true },
    where: { slug: { equals: categorySlug } },
  })
  const category = found.docs[0]
  const title = category && typeof category.title === 'string' ? category.title : null
  const canonicalPath = `/shop/${categorySlug}`

  const rawSub =
    typeof resolved.sub === 'string' ?
      resolved.sub
    : Array.isArray(resolved.sub) ?
      resolved.sub[0]
    : undefined
  const subTrimmed = rawSub?.trim()

  const hasFilteredQuery =
    (typeof resolved.q === 'string' && resolved.q.trim().length > 0) ||
    typeof resolved.sort === 'string' ||
    Boolean(subTrimmed)

  const baseMeta =
    title ?
      taxonomyMetadata({
        title,
        meta: (category as { meta?: Parameters<typeof taxonomyMetadata>[0]['meta'] })?.meta,
        fallbackDescription: `Browse ${title} nightwear and apparel online in Bangladesh.`,
        canonicalPath,
        pageTitleSuffix: 'Shop',
      })
    : shopListingMetadata({
        canonicalPath,
        description: 'Search for products in the store.',
        hasFilteredQuery,
        title: 'Shop',
      })

  if (!hasFilteredQuery || !title) return baseMeta

  return {
    ...baseMeta,
    robots: {
      follow: true,
      googleBot: { follow: true, index: false },
      index: false,
    },
  }
}

export default async function ShopCategoryPage({ params, searchParams }: Props) {
  const { categorySlug } = await params
  const resolved = await searchParams

  if (legacyCategoryId(resolved.category)) {
    const q = typeof resolved.q === 'string' ? resolved.q : undefined
    const sort = typeof resolved.sort === 'string' ? resolved.sort : undefined
    const legacySub = legacyCategoryId(resolved.sub)
    const sp = new URLSearchParams()
    if (q) sp.set('q', q)
    if (sort) sp.set('sort', sort)
    if (legacySub) sp.set('sub', legacySub)
    const qs = sp.toString()
    redirect(qs ? `/shop/${categorySlug}?${qs}` : `/shop/${categorySlug}`)
  }

  const payload = await getPayload({ config: configPromise })
  const found = await payload.find({
    collection: 'categories',
    where: { slug: { equals: categorySlug } },
    limit: 1,
  })

  const category = found.docs[0]
  if (!category) {
    notFound()
  }

  const filters = parseShopSearchParams(resolved)

  return (
    <ShopPageView
      categoryId={String(category.id)}
      categorySlug={categorySlug}
      {...filters}
    />
  )
}
