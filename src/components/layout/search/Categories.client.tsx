'use client'
import React, { useCallback, useMemo } from 'react'

import { Checkbox } from '@/components/ui/checkbox'
import { Category } from '@/payload-types'
import { createUrl } from '@/utilities/createUrl'
import { SHOP_BASE_PATH } from '@/utilities/shopPath'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { cn } from '@/utilities/cn'

type Props = {
  category: Category
}

export const CategoryItem: React.FC<Props> = ({ category }) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const slug = typeof category.slug === 'string' ? category.slug : null
  const categoryPath = slug ? `${SHOP_BASE_PATH}/${slug}` : SHOP_BASE_PATH

  const isActive = useMemo(() => {
    return Boolean(slug && pathname === categoryPath)
  }, [categoryPath, pathname, slug])

  const setQuery = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('category')
    params.delete('sub')

    const target = isActive ? SHOP_BASE_PATH : categoryPath
    router.push(createUrl(target, params))
  }, [categoryPath, isActive, router, searchParams])

  return (
    <label
      className={cn(
        'flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium text-foreground transition hover:bg-muted/50',
        isActive && 'bg-primary/10',
      )}
    >
      <Checkbox
        checked={isActive}
        onCheckedChange={() => setQuery()}
        className={cn(
          'border-primary/40 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
        )}
      />
      <span className="min-w-0 flex-1 select-none leading-snug">{category.title}</span>
    </label>
  )
}
