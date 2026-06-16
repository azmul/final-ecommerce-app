'use client'

import { LoyaltyPointsPanel } from '@/components/account/LoyaltyPointsPanel'
import { ReferralPanel } from '@/components/account/ReferralPanel'
import { SubscriptionsPanel } from '@/components/account/SubscriptionsPanel'
import { AddAddressSection } from '@/components/addresses/AddAddressSection'
import { AddressListing } from '@/components/addresses/AddressListing'
import { AccountOAuthLinks } from '@/components/auth/AccountOAuthLinks'
import { AccountForm } from '@/components/forms/AccountForm'
import { AccountPrivacyPanel } from '@/components/account/AccountPrivacyPanel'
import { NotificationsPageClient } from '@/components/notifications/NotificationsPageClient'
import { OrderItem } from '@/components/OrderItem'
import { Button } from '@/components/ui/button'
import { queueStateUpdate } from '@/hooks/queueStateUpdate'
import { accountTabHref, resolveAccountTabId, type AccountTabId } from '@/lib/account/accountTabs'
import type { Order } from '@/payload-types'
import { cn } from '@/utilities/cn'
import { SHOP_BASE_PATH } from '@/utilities/shopPath'
import {
  ArrowRight,
  Bell,
  ChevronRight,
  Gift,
  MapPin,
  Package,
  UserRound,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'

type TabConfig = {
  icon: ReactNode
  id: AccountTabId
  label: string
  mobileLabel: string
}

type AccountPageTabsProps = {
  initialTab?: string | null
  orders: Order[]
}

export function AccountPageTabs({ initialTab, orders }: AccountPageTabsProps) {
  const baseId = useId()
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabListRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [activeTab, setActiveTab] = useState<AccountTabId>(() => resolveAccountTabId(initialTab))

  const updateScrollHints = useCallback(() => {
    const element = tabListRef.current
    if (!element) return

    const { clientWidth, scrollLeft, scrollWidth } = element
    setCanScrollLeft(scrollLeft > 4)
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4)
  }, [])

  useEffect(() => {
    queueStateUpdate(() =>
      setActiveTab(resolveAccountTabId(searchParams.get('tab') ?? initialTab)),
    )
  }, [initialTab, searchParams])

  useEffect(() => {
    updateScrollHints()

    const element = tabListRef.current
    if (!element) return

    element.addEventListener('scroll', updateScrollHints, { passive: true })
    const resizeObserver = new ResizeObserver(updateScrollHints)
    resizeObserver.observe(element)

    return () => {
      element.removeEventListener('scroll', updateScrollHints)
      resizeObserver.disconnect()
    }
  }, [updateScrollHints])

  const tabs = useMemo<TabConfig[]>(
    () => [
      {
        icon: <UserRound aria-hidden className="size-4 shrink-0" />,
        id: 'profile',
        label: 'Profile',
        mobileLabel: 'Profile',
      },
      {
        icon: <Package aria-hidden className="size-4 shrink-0" />,
        id: 'orders',
        label: 'Orders',
        mobileLabel: 'Orders',
      },
      {
        icon: <MapPin aria-hidden className="size-4 shrink-0" />,
        id: 'addresses',
        label: 'Addresses',
        mobileLabel: 'Addresses',
      },
      {
        icon: <Bell aria-hidden className="size-4 shrink-0" />,
        id: 'notifications',
        label: 'Notifications',
        mobileLabel: 'Alerts',
      },
      {
        icon: <Gift aria-hidden className="size-4 shrink-0" />,
        id: 'rewards',
        label: 'Rewards',
        mobileLabel: 'Rewards',
      },
    ],
    [],
  )

  const selectTab = useCallback(
    (tab: AccountTabId) => {
      setActiveTab(tab)
      const href = accountTabHref(tab)
      router.replace(href, { scroll: false })
    },
    [router],
  )

  const safeActiveTab = activeTab
  const activeTabIndex = tabs.findIndex((tab) => tab.id === safeActiveTab)
  const hasOrders = orders.length > 0

  useEffect(() => {
    const element = tabListRef.current
    if (!element) return

    const activeButton = element.querySelector<HTMLElement>('[aria-selected="true"]')
    activeButton?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    })

    window.requestAnimationFrame(updateScrollHints)
  }, [safeActiveTab, updateScrollHints, tabs.length])

  function focusTab(index: number) {
    const tab = tabs[index]
    if (tab) selectTab(tab.id)
  }

  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      focusTab((index + 1) % tabs.length)
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      focusTab((index - 1 + tabs.length) % tabs.length)
    } else if (event.key === 'Home') {
      event.preventDefault()
      focusTab(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      focusTab(tabs.length - 1)
    }
  }

  return (
    <section
      aria-label="Account sections"
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
    >
      <div className="border-b border-border/70 bg-muted/10">
        <p className="px-4 pt-2 text-[11px] font-medium tracking-wide text-muted-foreground sm:hidden">
          Swipe tabs to see profile, orders, addresses, and more
        </p>

        <div className="relative sm:px-3">
          {canScrollLeft ?
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-linear-to-r from-muted/95 to-transparent sm:hidden"
            />
          : null}

          {canScrollRight ?
            <>
              <div
                aria-hidden
                className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-linear-to-l from-muted/95 via-muted/80 to-transparent sm:hidden"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute top-1/2 right-1.5 z-20 flex -translate-y-1/2 items-center gap-0.5 sm:hidden"
              >
                <ChevronRight className="size-4 text-muted-foreground/80" strokeWidth={2.25} />
              </div>
            </>
          : null}

          <div
            ref={tabListRef}
            aria-label="Account sections"
            className="flex snap-x snap-mandatory gap-1.5 overflow-x-auto px-4 py-2 scroll-ps-4 scroll-pe-10 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-2 sm:px-1 sm:py-3 sm:scroll-ps-0 sm:scroll-pe-0 [&::-webkit-scrollbar]:hidden"
            role="tablist"
          >
            {tabs.map((tab, index) => {
              const selected = safeActiveTab === tab.id
              const tabId = `${baseId}-${tab.id}-tab`
              const panelId = `${baseId}-${tab.id}-panel`

              return (
                <button
                  key={tab.id}
                  aria-controls={panelId}
                  aria-selected={selected}
                  className={cn(
                    'inline-flex min-h-11 shrink-0 snap-center touch-manipulation items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all sm:min-h-10 sm:snap-start sm:gap-2 sm:px-4',
                    'outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                    selected ?
                      'bg-background text-foreground shadow-sm ring-1 ring-border/80'
                    : 'text-muted-foreground hover:bg-background/70 hover:text-foreground',
                    index === tabs.length - 1 && 'mr-2 sm:mr-0',
                  )}
                  id={tabId}
                  onClick={() => selectTab(tab.id)}
                  onKeyDown={(event) => onTabKeyDown(event, index)}
                  role="tab"
                  tabIndex={selected ? 0 : -1}
                  type="button"
                >
                  {tab.icon}
                  <span className="whitespace-nowrap sm:hidden">{tab.mobileLabel}</span>
                  <span className="hidden whitespace-nowrap sm:inline">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div
          aria-label={`Section ${Math.max(activeTabIndex, 0) + 1} of ${tabs.length}`}
          className="flex items-center justify-center gap-3 px-4 pb-2.5 pt-1 sm:hidden"
          role="status"
        >
          <div className="flex items-center gap-1.5">
            {tabs.map((tab, index) => {
              const selected = index === activeTabIndex
              return (
                <span
                  key={tab.id}
                  aria-hidden
                  className={cn(
                    'rounded-full transition-all duration-200',
                    selected ?
                      'h-1.5 w-5 bg-primary'
                    : 'h-1.5 w-1.5 bg-muted-foreground/35',
                  )}
                />
              )
            })}
          </div>
          <span className="text-[11px] tabular-nums text-muted-foreground">
            {Math.max(activeTabIndex, 0) + 1}/{tabs.length}
          </span>
        </div>
      </div>

      <div
        aria-labelledby={`${baseId}-profile-tab`}
        className={cn('p-6 sm:p-8', safeActiveTab === 'profile' ? 'block' : 'hidden')}
        id={`${baseId}-profile-panel`}
        role="tabpanel"
        tabIndex={0}
      >
        <div className="mx-auto flex max-w-2xl flex-col gap-8">
          <div>
            <h2 className="text-lg font-medium tracking-tight text-foreground">Profile &amp; security</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Keep your phone, optional email, and name current. Use the link inside the form to
              rotate your password when you need to.
            </p>
          </div>
          <AccountForm />
          <AccountOAuthLinks />
          <AccountPrivacyPanel />
        </div>
      </div>

      <div
        aria-labelledby={`${baseId}-orders-tab`}
        className={cn('p-6 sm:p-8', safeActiveTab === 'orders' ? 'block' : 'hidden')}
        id={`${baseId}-orders-panel`}
        role="tabpanel"
        tabIndex={0}
      >
        <div className="mb-6 space-y-1">
          <h2 className="text-lg font-medium tracking-tight text-foreground">Your orders</h2>
          <p className="text-sm text-muted-foreground">
            Track status and totals for your purchases.
          </p>
        </div>
        {hasOrders ?
          <ul className="flex flex-col gap-4">
            {orders.map((order) => (
              <li key={order.id}>
                <OrderItem order={order} />
              </li>
            ))}
          </ul>
        : <div className="flex flex-col items-center rounded-xl border border-dashed border-border/80 bg-muted/10 px-6 py-12 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
              <Package aria-hidden className="h-5 w-5" />
            </div>
            <h3 className="text-base font-medium text-foreground">No orders yet</h3>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              When you place an order, it will appear here with status and totals.
            </p>
            <Button asChild className="mt-6 gap-2">
              <Link href={SHOP_BASE_PATH}>
                Browse the shop
                <ArrowRight aria-hidden className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        }
      </div>

      <div
        aria-labelledby={`${baseId}-addresses-tab`}
        className={cn('p-6 sm:p-8', safeActiveTab === 'addresses' ? 'block' : 'hidden')}
        id={`${baseId}-addresses-panel`}
        role="tabpanel"
        tabIndex={0}
      >
        <div className="mb-6 space-y-1">
          <h2 className="text-lg font-medium tracking-tight text-foreground">Saved addresses</h2>
          <p className="text-sm text-muted-foreground">
            Manage delivery addresses used at checkout.
          </p>
        </div>
        <div className="mb-8">
          <AddressListing />
        </div>
        <AddAddressSection />
      </div>

      <div
        aria-labelledby={`${baseId}-notifications-tab`}
        className={cn('p-6 sm:p-8', safeActiveTab === 'notifications' ? 'block' : 'hidden')}
        id={`${baseId}-notifications-panel`}
        role="tabpanel"
        tabIndex={0}
      >
        <NotificationsPageClient />
      </div>

      <div
        aria-labelledby={`${baseId}-rewards-tab`}
        className={cn(
          'flex flex-col gap-6 p-6 sm:gap-8 sm:p-8',
          safeActiveTab === 'rewards' ? 'flex' : 'hidden',
        )}
        id={`${baseId}-rewards-panel`}
        role="tabpanel"
        tabIndex={0}
      >
        <div className="space-y-1">
          <h2 className="text-lg font-medium tracking-tight text-foreground">Rewards &amp; subscriptions</h2>
          <p className="text-sm text-muted-foreground">
            Loyalty points, referrals, and recurring orders linked to your account.
          </p>
        </div>
        <LoyaltyPointsPanel />
        <ReferralPanel />
        <SubscriptionsPanel />
      </div>
    </section>
  )
}
