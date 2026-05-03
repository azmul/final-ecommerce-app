'use client'

import { createUrl } from '@/utilities/createUrl'
import { SHOP_BASE_PATH } from '@/utilities/shopPath'
import clsx from 'clsx'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import React from 'react'

export type ShopSubcategoryLite = {
  id: number | string
  title: string
  slug: string | null | undefined
}

export function ShopSubcategoryFilters({
  categorySlug,
  subcategories,
}: {
  categorySlug: string
  subcategories: ShopSubcategoryLite[]
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  if (!subcategories.length) {
    return null
  }

  const base = `${SHOP_BASE_PATH}/${categorySlug}`
  if (pathname !== base) {
    return null
  }

  const subsWithSlug = subcategories.filter(
    (sub) => typeof sub.slug === 'string' && sub.slug.length > 0,
  )
  if (!subsWithSlug.length) {
    return null
  }

  const activeSub = searchParams.get('sub')?.trim()

  const buildHref = (subSlug: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (subSlug) {
      params.set('sub', subSlug)
    } else {
      params.delete('sub')
    }
    return createUrl(base, params)
  }

  const pill = (isActive: boolean) =>
    clsx(
      'inline-flex rounded-full border px-3 py-2 text-left text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:px-4 sm:py-2',
      isActive
        ? 'border-primary bg-primary text-primary-foreground shadow-sm hover:bg-primary/90'
        : 'border-border bg-muted/40 text-foreground hover:border-primary/50 hover:bg-muted',
    )

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-foreground">Subcategories</h3>
      <ul className="flex flex-wrap gap-2">
        <li className="shrink-0 list-none">
          <Link className={pill(!activeSub)} href={buildHref(null)}>
            All
          </Link>
        </li>
        {subsWithSlug.map((sub) => {
          const slug = sub.slug as string
          const isActive = activeSub === slug
          return (
            <li className="shrink-0 list-none" key={String(sub.id)}>
              <Link className={pill(isActive)} href={buildHref(slug)}>
                {sub.title}
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
