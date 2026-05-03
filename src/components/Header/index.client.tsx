'use client'
import { CMSLink } from '@/components/Link'
import { Cart } from '@/components/Cart'
import { OpenCartButton } from '@/components/Cart/OpenCart'
import { WishlistNavLink } from '@/components/WishlistNavLink'
import Link from 'next/link'
import React, { Suspense } from 'react'

import { MobileMenu } from './MobileMenu'
import { ShopCategoryNav } from './ShopCategoryNav.client'
import type { ShopCategoryNavCategory } from './shopCategoryNavData'
import type { Header } from 'src/payload-types'

import { LogoIcon } from '@/components/icons/logo'
import { usePathname } from 'next/navigation'
import { cmsPageGutterClassName } from '@/utilities/cmsLayout'
import { cn } from '@/utilities/cn'

type Props = {
  header: Header
  shopCategories: ShopCategoryNavCategory[]
  siteName: string
}

export function HeaderClient({ header, shopCategories, siteName }: Props) {
  const menu = header.navItems || []
  const pathname = usePathname()

  return (
    <header className="relative z-20 border-b" data-site-header>
      <nav
        aria-label="Main navigation"
        className={cn(cmsPageGutterClassName, 'flex items-center justify-between pt-2')}
      >
        <div className="block flex-none md:hidden">
          <Suspense fallback={null}>
            <MobileMenu menu={menu} shopCategories={shopCategories} />
          </Suspense>
        </div>
        <div className="flex w-full items-center justify-between">
          <div className="flex w-full items-center gap-6 md:w-1/3">
            <Link className="flex w-full items-center justify-center pt-4 pb-4 md:w-auto" href="/">
              <LogoIcon className="w-6 h-auto" aria-hidden />
              <span className="sr-only">{siteName}</span>
            </Link>
            {menu.length ? (
              <ul className="hidden gap-4 text-sm md:flex md:items-center">
                {menu.map((item) => (
                  <li key={item.id}>
                    <CMSLink
                      {...item.link}
                      size={'clear'}
                      className={cn('relative navLink', {
                        active:
                          item.link.url && item.link.url !== '/'
                            ? pathname.includes(item.link.url)
                            : false,
                      })}
                      appearance="nav"
                    />
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="flex items-center justify-end gap-4 md:w-1/3">
            <Suspense fallback={null}>
              <WishlistNavLink />
            </Suspense>
            <Suspense fallback={<OpenCartButton />}>
              <Cart />
            </Suspense>
          </div>
        </div>
      </nav>
      <Suspense fallback={null}>
        <ShopCategoryNav categories={shopCategories} />
      </Suspense>
    </header>
  )
}
