import { ShopPageView } from '@/app/(app)/shop/ShopPageView'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import React from 'react'

import { parseShopSearchParams } from '@/lib/search/parseShopSearchParams'
import { shopListingMetadata } from '@/utilities/shopListingSeo'

const shopDescription = 'Search for products in the store.'

type SearchParams = { [key: string]: string | string[] | undefined }

type MetadataProps = {
  searchParams: Promise<SearchParams>
}

export async function generateMetadata({ searchParams }: MetadataProps): Promise<Metadata> {
  const resolved = await searchParams
  const hasFilteredQuery =
    (typeof resolved.q === 'string' && resolved.q.trim().length > 0) ||
    typeof resolved.sort === 'string'

  return shopListingMetadata({
    canonicalPath: '/shop',
    description: shopDescription,
    hasFilteredQuery,
    title: 'Shop',
  })
}

type Props = {
  searchParams: Promise<SearchParams>
}

function legacyCategoryId(param: string | string[] | undefined): string | undefined {
  if (typeof param === 'string') return param
  if (Array.isArray(param)) return param[0]
  return undefined
}

export default async function ShopPage({ searchParams }: Props) {
  const resolved = await searchParams
  const categoryIdLegacy = legacyCategoryId(resolved.category)

  if (categoryIdLegacy) {
    const payload = await getPayload({ config: configPromise })
    const q = typeof resolved.q === 'string' ? resolved.q : undefined
    const sort = typeof resolved.sort === 'string' ? resolved.sort : undefined

    try {
      const doc = await payload.findByID({
        collection: 'categories',
        id: categoryIdLegacy,
      })
      const slug = typeof doc?.slug === 'string' ? doc.slug : undefined
      if (slug) {
        const sp = new URLSearchParams()
        if (q) sp.set('q', q)
        if (sort) sp.set('sort', sort)
        const qs = sp.toString()
        redirect(qs ? `/shop/${slug}?${qs}` : `/shop/${slug}`)
      }
    } catch {
      // invalid category id
    }

    const sp = new URLSearchParams()
    if (q) sp.set('q', q)
    if (sort) sp.set('sort', sort)
    const qs = sp.toString()
    redirect(qs ? `/shop?${qs}` : `/shop`)
  }

  const filters = parseShopSearchParams(resolved)

  return <ShopPageView {...filters} />
}
