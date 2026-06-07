'use client'

import type { Header } from '@/payload-types'

import type { ShopCategoryNavCategory } from './shopCategoryNavData'
import { CMSLink } from '@/components/Link'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useAuth } from '@/providers/Auth'
import { createUrl } from '@/utilities/createUrl'
import { accountTabHref, type AccountTabId } from '@/lib/account/accountTabs'
import { SHOP_BASE_PATH } from '@/utilities/shopPath'
import { cn } from '@/utilities/cn'
import {
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  LogOutIcon,
  MapPin,
  Bell,
  Gift,
  MenuIcon,
  Package,
  ShoppingBag,
  UserRound,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { queueStateUpdate } from '@/hooks/queueStateUpdate'
import React, { useEffect, useState } from 'react'

interface Props {
  menu: Header['navItems']
  shopCategories: ShopCategoryNavCategory[]
  siteName: string
}

/** Match `screens.header-desktop` in tailwind.config (iPad Pro landscape stays below). */
const DESKTOP_NAV_MIN_WIDTH_PX = 1400

const ACCENT_CLASS = 'text-[#d4a017]'
const ACCENT_SELECTION =
  'bg-[#d4a017]/12 font-semibold text-[#d4a017] ring-1 ring-[#d4a017]/35 dark:bg-[#d4a017]/14 dark:ring-[#d4a017]/45'

function resolveHeaderNavHref(
  link: NonNullable<NonNullable<Header['navItems']>[number]>['link'],
): string | null {
  const { reference, type, url } = link
  if (
    type === 'reference' &&
    reference?.value &&
    typeof reference.value === 'object' &&
    'slug' in reference.value &&
    reference.value.slug
  ) {
    const slug = reference.value.slug
    return slug === 'home' ? '/' : `/${slug}`
  }
  return url ?? null
}

function isHeaderNavActive(href: string | null, pathname: string): boolean {
  if (!href) return false
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

function isMobileAccountShortcutActive(
  pathname: string,
  searchParams: URLSearchParams,
  tab: AccountTabId,
): boolean {
  if (tab === 'orders') {
    return pathname === '/orders' || pathname.startsWith('/orders/')
  }

  if (pathname !== '/account') {
    return false
  }

  const currentTab = searchParams.get('tab')
  if (tab === 'profile') {
    return !currentTab || currentTab === 'profile'
  }

  return currentTab === tab
}

export function MobileMenu({ menu, shopCategories, siteName }: Props) {
  const { user } = useAuth()

  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(false)
  const [openShopCatId, setOpenShopCatId] = useState<string | null>(null)

  const closeMobileMenu = () => setIsOpen(false)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= DESKTOP_NAV_MIN_WIDTH_PX) {
        setIsOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isOpen])

  useEffect(() => {
    queueStateUpdate(() => setIsOpen(false))
  }, [pathname, searchParams])

  useEffect(() => {
    if (!isOpen) {
      queueStateUpdate(() => setOpenShopCatId(null))
    }
  }, [isOpen])

  return (
    <Sheet onOpenChange={setIsOpen} open={isOpen}>
      <SheetTrigger
        className={cn(
          'group relative flex size-11 items-center justify-center rounded-xl border border-border/80 bg-muted/35 text-foreground shadow-sm backdrop-blur-sm outline-none transition-all',
          'hover:border-[#d4a017]/40 hover:bg-muted/65 hover:shadow-md',
          'focus-visible:border-[#d4a017]/50 focus-visible:ring-[3px] focus-visible:ring-[#d4a017]/30',
          'active:scale-[0.97] dark:bg-muted/20 dark:hover:bg-muted/40',
        )}
        aria-label="Open menu"
      >
        <MenuIcon className="size-[18px] transition-transform group-hover:scale-105 group-active:scale-95" strokeWidth={2} />
      </SheetTrigger>

      <SheetContent
        side="left"
        overlayClassName="bg-black/45 backdrop-blur-[3px]"
        className={cn(
          'flex min-h-0 w-[88vw] max-w-88 flex-col gap-5 overflow-hidden border-r border-border/60 px-4 sm:gap-6',
          'bg-linear-to-b from-card via-background to-background',
        )}
      >
        <SheetHeader className="shrink-0 border-b border-border/70 bg-muted/25 px-0 pt-12 pb-6 dark:bg-muted/15">
          <div className="flex items-start gap-3">
            <span
              aria-hidden
              className={cn(
                'mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-xl shadow-inner',
                'border border-[#d4a017]/35 bg-linear-to-br from-[#f2d56a]/90 to-[#c9940a]/95 text-[13px] dark:from-[#d4b84a]/30 dark:to-[#8f6f10]/65',
              )}
            >
              <ShoppingBag className="size-[22px] text-[#222] dark:text-[#fde68a]" strokeWidth={1.75} />
            </span>
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-lg font-semibold tracking-tight sm:text-xl">
                {siteName}
              </SheetTitle>
              <SheetDescription className="mt-1 text-muted-foreground text-xs leading-snug tracking-wide uppercase">
                Navigate & browse
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-8 [-webkit-overflow-scrolling:touch]">
          <div className="pt-2">
            {menu?.length ? (
              <>
                <p className="mb-3 flex items-center gap-2 text-[11px] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
                  <LayoutGrid aria-hidden className="size-3.5 shrink-0 text-[#d4a017]/80" strokeWidth={2} />
                  Menu
                </p>
                <ul className="flex w-full flex-col gap-1.5">
                  {menu.map((item) => {
                    const href = resolveHeaderNavHref(item.link)
                    const navActive = isHeaderNavActive(href, pathname)
                    return (
                      <li key={item.id}>
                        <CMSLink
                          {...item.link}
                          appearance="inline"
                          className={cn(
                            'group relative flex min-h-12 w-full touch-manipulation items-center justify-between rounded-xl px-4 py-3 text-[15px] font-medium tracking-tight',
                            'text-foreground/95 transition-colors',
                            'hover:bg-muted/80 active:bg-muted dark:hover:bg-muted/50',
                            navActive ? ACCENT_SELECTION : null,
                          )}
                          onClick={closeMobileMenu}
                        >
                          <ChevronRight
                            aria-hidden
                            className={cn(
                              'size-4 shrink-0 opacity-40 transition-opacity',
                              navActive && cn('opacity-100', ACCENT_CLASS),
                              'group-hover:opacity-55',
                            )}
                          />
                        </CMSLink>
                      </li>
                    )
                  })}
                </ul>
              </>
            ) : null}

            {shopCategories.length > 0 ? (
              <div className="space-y-3 border-t border-border/80 pt-6">
                <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
                  <Package aria-hidden className="size-3.5 shrink-0 text-[#d4a017]/80" strokeWidth={2} />
                  Shop by category
                </p>
                <ul className="flex flex-col gap-1">
                  {shopCategories.map((cat) => {
                    const categoryPath = `${SHOP_BASE_PATH}/${cat.slug}`
                    const hasSubs = cat.subcategories.length > 0
                    const expanded = openShopCatId === cat.id
                    const catActive = pathname === categoryPath
                    return (
                      <li
                        className="overflow-hidden rounded-xl border border-transparent bg-muted/20 transition-colors dark:bg-muted/10"
                        key={cat.id}
                      >
                        <div className="flex items-center gap-0">
                          <Link
                            className={cn(
                              'relative min-h-11 min-w-0 flex-1 touch-manipulation truncate px-3.5 py-3 text-sm font-medium transition-colors hover:bg-muted/40 dark:hover:bg-muted/25',
                              catActive ? cn(ACCENT_CLASS, 'bg-[#d4a017]/08 font-semibold') : null,
                            )}
                            href={categoryPath}
                            onClick={closeMobileMenu}
                          >
                            {cat.title}
                          </Link>
                          {hasSubs ? (
                            <button
                              type="button"
                              className={cn(
                                'flex size-11 shrink-0 items-center justify-center touch-manipulation text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground',
                              )}
                              aria-expanded={expanded}
                              aria-label={expanded ? `Hide ${cat.title} subcategories` : `Show ${cat.title} subcategories`}
                              onClick={() =>
                                setOpenShopCatId((cur) => (cur === cat.id ? null : cat.id))
                              }
                            >
                              <ChevronDown
                                className={cn('size-4 transition-transform duration-200', expanded && 'rotate-180')}
                                aria-hidden
                              />
                            </button>
                          ) : null}
                        </div>
                        {hasSubs && expanded ? (
                          <ul className="flex flex-col gap-0 rounded-b-[inherit] bg-background/65 px-2 pb-2 pt-1 dark:bg-background/40">
                            {cat.subcategories.map((sub) => {
                              const params = new URLSearchParams()
                              params.set('sub', sub.slug)
                              const href = createUrl(categoryPath, params)
                              const subActive =
                                pathname === categoryPath &&
                                searchParams.get('sub')?.trim() === sub.slug
                              return (
                                <li key={sub.id}>
                                  <Link
                                    className={cn(
                                      'block rounded-lg py-2.5 pr-3 pl-5 text-[13px] text-muted-foreground transition-colors hover:bg-muted/55 hover:text-foreground',
                                      subActive && cn('font-semibold text-foreground', ACCENT_CLASS),
                                    )}
                                    href={href}
                                    onClick={closeMobileMenu}
                                  >
                                    {sub.title}
                                  </Link>
                                </li>
                              )
                            })}
                          </ul>
                        ) : null}
                      </li>
                    )
                  })}
                </ul>
              </div>
            ) : null}
          </div>

          {user ? (
            <section className="mt-10 rounded-2xl border border-border/80 bg-muted/25 p-4 shadow-inner dark:bg-muted/15">
              <h2 className="mb-1 text-[11px] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
                My account
              </h2>
              <nav aria-label="Account">
                <ul className="mt-4 flex flex-col gap-1">
                  <li>
                    <Link
                      className={cn(
                        'flex min-h-11 items-center gap-3 rounded-xl px-2 text-sm font-medium transition-colors hover:bg-background/85 dark:hover:bg-background/55',
                        isMobileAccountShortcutActive(pathname, searchParams, 'profile') &&
                          cn('bg-background/85 font-semibold', ACCENT_CLASS, 'dark:bg-background/40'),
                      )}
                      href={accountTabHref('profile')}
                      onClick={closeMobileMenu}
                    >
                      <UserRound aria-hidden className="size-[18px] shrink-0 text-muted-foreground" strokeWidth={2} />
                      Account settings
                    </Link>
                  </li>
                  <li>
                    <Link
                      className={cn(
                        'flex min-h-11 items-center gap-3 rounded-xl px-2 text-sm font-medium transition-colors hover:bg-background/85 dark:hover:bg-background/55',
                        isMobileAccountShortcutActive(pathname, searchParams, 'addresses') &&
                          cn('bg-background/85 font-semibold', ACCENT_CLASS, 'dark:bg-background/40'),
                      )}
                      href={accountTabHref('addresses')}
                      onClick={closeMobileMenu}
                    >
                      <MapPin aria-hidden className="size-[18px] shrink-0 text-muted-foreground" strokeWidth={2} />
                      Addresses
                    </Link>
                  </li>
                  <li>
                    <Link
                      className={cn(
                        'flex min-h-11 items-center gap-3 rounded-xl px-2 text-sm font-medium transition-colors hover:bg-background/85 dark:hover:bg-background/55',
                        isMobileAccountShortcutActive(pathname, searchParams, 'orders') &&
                          cn('bg-background/85 font-semibold', ACCENT_CLASS, 'dark:bg-background/40'),
                      )}
                      href={accountTabHref('orders')}
                      onClick={closeMobileMenu}
                    >
                      <Package aria-hidden className="size-[18px] shrink-0 text-muted-foreground" strokeWidth={2} />
                      Orders
                    </Link>
                  </li>
                  <li>
                    <Link
                      className={cn(
                        'flex min-h-11 items-center gap-3 rounded-xl px-2 text-sm font-medium transition-colors hover:bg-background/85 dark:hover:bg-background/55',
                        isMobileAccountShortcutActive(pathname, searchParams, 'notifications') &&
                          cn('bg-background/85 font-semibold', ACCENT_CLASS, 'dark:bg-background/40'),
                      )}
                      href={accountTabHref('notifications')}
                      onClick={closeMobileMenu}
                    >
                      <Bell aria-hidden className="size-[18px] shrink-0 text-muted-foreground" strokeWidth={2} />
                      Notifications
                    </Link>
                  </li>
                  <li>
                    <Link
                      className={cn(
                        'flex min-h-11 items-center gap-3 rounded-xl px-2 text-sm font-medium transition-colors hover:bg-background/85 dark:hover:bg-background/55',
                        isMobileAccountShortcutActive(pathname, searchParams, 'rewards') &&
                          cn('bg-background/85 font-semibold', ACCENT_CLASS, 'dark:bg-background/40'),
                      )}
                      href={accountTabHref('rewards')}
                      onClick={closeMobileMenu}
                    >
                      <Gift aria-hidden className="size-[18px] shrink-0 text-muted-foreground" strokeWidth={2} />
                      Rewards
                    </Link>
                  </li>
                </ul>
              </nav>
              <Button asChild className="group mt-4 w-full rounded-xl shadow-sm" variant="outline">
                <Link href="/logout" onClick={closeMobileMenu}>
                  <LogOutIcon aria-hidden className="mr-2 size-[15px]" strokeWidth={2} />
                  Log out
                </Link>
              </Button>
            </section>
          ) : (
            <section className="mt-10 rounded-2xl border border-border/80 bg-muted/25 p-4 pt-5 shadow-inner dark:bg-muted/15">
              <h2 className="mb-4 text-[11px] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
                My account
              </h2>
              <div className="flex flex-col gap-3">
                <Button asChild className="w-full rounded-xl shadow-sm" variant="default">
                  <Link href="/login" onClick={closeMobileMenu}>
                    Log in
                  </Link>
                </Button>
                <p className="text-center text-xs leading-relaxed text-muted-foreground">
                  New here? Sign up below.
                </p>
                <Button asChild className="w-full rounded-xl shadow-sm" variant="outline">
                  <Link href="/create-account" onClick={closeMobileMenu}>
                    Create an account
                  </Link>
                </Button>
              </div>
            </section>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
