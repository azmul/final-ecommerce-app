import { ShopPageView } from '@/app/(app)/shop/ShopPageView'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import React from 'react'

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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categorySlug } = await params
  const payload = await getPayload({ config: configPromise })
  const found = await payload.find({
    collection: 'categories',
    where: { slug: { equals: categorySlug } },
    limit: 1,
    select: { title: true },
  })
  const title = found.docs[0] && typeof found.docs[0].title === 'string' ? found.docs[0].title : null
  return {
    description: title ? `Browse ${title} in the store.` : 'Search for products in the store.',
    title: title ? `${title} · Shop` : 'Shop',
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

  const searchValue = typeof resolved.q === 'string' ? resolved.q : undefined
  const sort = typeof resolved.sort === 'string' ? resolved.sort : undefined
  const rawSub =
    typeof resolved.sub === 'string'
      ? resolved.sub
      : Array.isArray(resolved.sub)
        ? resolved.sub[0]
        : undefined
  const subcategorySlug = rawSub?.trim() ? rawSub.trim() : undefined

  return (
    <ShopPageView
      categoryId={String(category.id)}
      categorySlug={categorySlug}
      searchValue={searchValue}
      sort={sort}
      subcategorySlug={subcategorySlug}
    />
  )
}
