import { ShopPageView } from '@/app/(app)/shop/ShopPageView'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import React from 'react'

import { getServerSideURL } from '@/utilities/getURL'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'

const shopCanonicalUrl = `${getServerSideURL()}/shop`
const shopDescription = 'Search for products in the store.'

export const metadata: Metadata = {
  alternates: { canonical: shopCanonicalUrl },
  description: shopDescription,
  openGraph: mergeOpenGraph({
    description: shopDescription,
    title: 'Shop',
    url: shopCanonicalUrl,
  }),
  title: 'Shop',
  twitter: {
    card: 'summary_large_image',
    description: shopDescription,
    title: 'Shop',
  },
}

type SearchParams = { [key: string]: string | string[] | undefined }

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

  const searchValue = typeof resolved.q === 'string' ? resolved.q : undefined
  const sort = typeof resolved.sort === 'string' ? resolved.sort : undefined

  return <ShopPageView searchValue={searchValue} sort={sort} />
}
