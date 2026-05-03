'use client'

import { createUrl } from '@/utilities/createUrl'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

/** Removes shop-only query keys so product URLs stay like `/products/x?color=…&variant=…`. */
export function StripShopParamsFromProductUrl() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!pathname.startsWith('/products/')) return
    const next = new URLSearchParams(searchParams.toString())
    if (!next.has('category') && !next.has('sub')) return

    next.delete('category')
    next.delete('sub')
    router.replace(createUrl(pathname, next), { scroll: false })
  }, [pathname, router, searchParams])

  return null
}
