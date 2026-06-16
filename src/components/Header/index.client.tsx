'use client'
import { CMSLink } from '@/components/Link'
import { Cart } from '@/components/Cart'
import { OpenCartButton } from '@/components/Cart/OpenCart'
import { WishlistNavLink } from '@/components/WishlistNavLink'
import Link from 'next/link'
import React, { Suspense } from 'react'

import { HeaderMoreMenu } from './HeaderMoreMenu'
import { MobileMenu } from './MobileMenu'
import { GlobalProductSearch } from './GlobalProductSearch'
import { ShopCategoryNav } from './ShopCategoryNav.client'
import type { ShopCategoryNavCategory } from './shopCategoryNavData'
import type { Header } from 'src/payload-types'

import { LogoIcon } from '@/components/icons/logo'
import { usePathname } from 'next/navigation'
import { cmsPageGutterClassName } from '@/utilities/cmsLayout'
import { cn } from '@/utilities/cn'

type Props = {
  contactPhone?: string
  header: Header
  shopCategories: ShopCategoryNavCategory[]
  siteName: string
}

export function HeaderClient({ contactPhone, header, shopCategories, siteName }: Props) {
  const menu = header.navItems || []
  const pathname = usePathname()

  return (
    <header className="relative z-20 border-b" data-site-header>
      <nav
        aria-label="Main navigation"
        className={cn(
          cmsPageGutterClassName,
          'relative z-30 pb-3 pt-2 header-desktop:pb-4 header-desktop:pt-3',
        )}
      >
        {/** Below header-desktop (~1400px): two-row mobile-style header incl. iPad Pro landscape. */}
        <div
          className={cn(
            'flex w-full min-w-0 flex-col gap-3 sm:gap-y-3',
            'header-desktop:grid header-desktop:grid-cols-[minmax(0,1fr)_400px_minmax(0,1fr)] header-desktop:items-center header-desktop:gap-x-5 header-desktop:gap-y-0',
          )}
        >
          <div
            className={cn(
              'flex w-full min-w-0 items-center justify-between gap-2 sm:gap-3',
              'header-desktop:contents',
            )}
          >
            <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3 header-desktop:flex-none header-desktop:gap-6 header-desktop:col-start-1 header-desktop:row-start-1">
              <div className="block flex-none header-desktop:hidden">
                <Suspense fallback={null}>
                  <MobileMenu menu={menu} shopCategories={shopCategories} siteName={siteName} />
                </Suspense>
              </div>
              <div className="flex min-w-0 items-center gap-3 header-desktop:gap-6">
                <Link
                  className="flex min-h-[44px] min-w-[44px] shrink-0 items-center py-3 header-desktop:min-h-0 header-desktop:min-w-0 header-desktop:py-3"
                  href="/"
                >
                  <LogoIcon className="w-6 h-auto" aria-hidden />
                  <span className="sr-only">{siteName}</span>
                </Link>
                {menu.length ? (
                  <ul className="hidden gap-4 text-sm header-desktop:flex header-desktop:items-center">
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
            </div>

            <div
              className={cn(
                'flex shrink-0 items-center justify-end gap-2 sm:gap-3 header-desktop:col-start-3 header-desktop:row-start-1 header-desktop:justify-self-end header-desktop:gap-4',
              )}
            >
              <Suspense fallback={null}>
                <WishlistNavLink />
              </Suspense>
              <Suspense fallback={<OpenCartButton />}>
                <Cart />
              </Suspense>
              <HeaderMoreMenu contactPhone={contactPhone} />
            </div>
          </div>

          <div className="w-full min-w-0 max-w-xl self-center sm:max-w-2xl header-desktop:col-start-2 header-desktop:row-start-1 header-desktop:w-[400px] header-desktop:max-w-none header-desktop:justify-self-center">
            <GlobalProductSearch className="w-full" />
          </div>
        </div>
      </nav>
      <Suspense fallback={null}>
        <ShopCategoryNav categories={shopCategories} />
      </Suspense>
    </header>
  )
}
