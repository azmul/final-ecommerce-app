import type { Metadata } from 'next'

import { ArrowRight, LogOut, MapPin, Package, UserRound } from 'lucide-react'
import Link from 'next/link'
import { headers as getHeaders } from 'next/headers.js'
import configPromise from '@payload-config'

import { LoyaltyPointsPanel } from '@/components/account/LoyaltyPointsPanel'
import { ReferralPanel } from '@/components/account/ReferralPanel'
import { SubscriptionsPanel } from '@/components/account/SubscriptionsPanel'
import { AccountOAuthLinks } from '@/components/auth/AccountOAuthLinks'
import { AccountForm } from '@/components/forms/AccountForm'
import { OrderItem } from '@/components/OrderItem'
import { Button } from '@/components/ui/button'
import type { Order, User } from '@/payload-types'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'

import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { SHOP_BASE_PATH } from '@/utilities/shopPath'
import { cn } from '@/utilities/cn'
import { ensureNotificationPreferences } from '@/lib/notifications/ensureNotificationPreferences'

function accountGreetingFirstName(user: User): string {
  const trimmed = user.name?.trim()
  if (trimmed) {
    const first = trimmed.split(/\s+/)[0]
    if (first) return first
  }
  const local = user.email?.split('@')[0]?.trim()
  return local?.length ? local : 'there'
}

function accountInitials(user: User): string {
  const fromName = user.name?.trim()
  if (fromName) {
    const parts = fromName.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) {
      return `${parts[0]![0] ?? ''}${parts[parts.length - 1]![0] ?? ''}`.toUpperCase()
    }
    return fromName.slice(0, 2).toUpperCase()
  }
  return (user.email?.slice(0, 2) || '?').toUpperCase()
}

export default async function AccountPage() {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })

  let orders: Order[] | null = null

  if (!user) {
    redirect(
      `/login?warning=${encodeURIComponent('Please login to access your account settings.')}`,
    )
  }

  await ensureNotificationPreferences(payload, user.id)

  try {
    const ordersResult = await payload.find({
      collection: 'orders',
      limit: 5,
      user,
      overrideAccess: false,
      pagination: false,
      where: {
        customer: {
          equals: user?.id,
        },
      },
    })

    orders = ordersResult?.docs || []
  } catch (_error) {
    // Template may build before APIs are live; render with empty orders where needed.
  }

  const firstName = accountGreetingFirstName(user)
  const initials = accountInitials(user)
  const hasOrders = orders && orders.length > 0

  return (
    <div className="flex flex-col gap-10">
      <section
        aria-label="Account overview"
        className="relative overflow-hidden rounded-2xl border border-border bg-linear-to-br from-card via-card to-muted/30 p-6 shadow-sm sm:p-8"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/[0.07] blur-2xl"
        />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-4 sm:items-center">
            <div
              aria-hidden
              className={cn(
                'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl',
                'bg-primary/10 text-base font-semibold tracking-tight text-primary',
              )}
            >
              {initials}
            </div>
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Your account
              </p>
              <h1 className="text-pretty font-serif text-3xl tracking-tight text-foreground sm:text-4xl">
                Hello, {firstName}
              </h1>
              <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
                See recent orders and manage your profile in one place. Updates here sync across
                checkout and saved details.
              </p>
            </div>
          </div>
          <nav
            aria-label="Account shortcuts"
            className="hidden shrink-0 flex-wrap gap-2 md:flex md:flex-col md:items-end"
          >
            <Button asChild variant="outline" size="sm" className="shadow-none">
              <Link href="/account/addresses" className="gap-2">
                <MapPin aria-hidden className="h-3.5 w-3.5" />
                Addresses
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="shadow-none">
              <Link href="/orders" className="gap-2">
                <Package aria-hidden className="h-3.5 w-3.5" />
                All orders
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground sm:self-end">
              <Link href="/logout" className="gap-2">
                <LogOut aria-hidden className="h-3.5 w-3.5" />
                Log out
              </Link>
            </Button>
          </nav>
        </div>
      </section>

      <LoyaltyPointsPanel />

      <ReferralPanel />

      <SubscriptionsPanel />

      <AccountOAuthLinks />

      <section
        aria-labelledby="orders-heading"
        className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
      >
        <header className="flex flex-col gap-4 border-b border-border bg-muted/20 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background text-primary shadow-sm ring-1 ring-border/60">
              <Package aria-hidden className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0 space-y-1">
              <h2 id="orders-heading" className="text-lg font-medium tracking-tight text-foreground">
                Recent orders
              </h2>
              <p className="text-sm text-muted-foreground">
                The latest activity on your purchases. Full history lives on your orders page.
              </p>
            </div>
          </div>
          {hasOrders ? (
            <Button asChild variant="outline" size="sm" className="shadow-none sm:shrink-0">
              <Link href="/orders" className="gap-2">
                View all
                <ArrowRight aria-hidden className="h-3.5 w-3.5" />
              </Link>
            </Button>
          ) : null}
        </header>

        <div className="p-6 sm:p-8">
          {hasOrders ? (
            <ul className="flex flex-col gap-4">
              {orders!.map((order) => (
                <li key={order.id}>
                  <OrderItem order={order} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center rounded-xl border border-dashed border-border/80 bg-muted/10 px-6 py-12 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
                <Package aria-hidden className="h-5 w-5" />
              </div>
              <h3 className="text-base font-medium text-foreground">No orders yet</h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                When you place an order, it will appear here with status and totals. Explore the shop
                to get started.
              </p>
              <Button asChild className="mt-6 gap-2">
                <Link href={SHOP_BASE_PATH}>
                  Browse the shop
                  <ArrowRight aria-hidden className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      <section
        aria-labelledby="profile-heading"
        className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
      >
        <header className="flex flex-wrap items-start gap-4 border-b border-border bg-muted/20 px-6 py-5 sm:px-8">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background text-primary shadow-sm ring-1 ring-border/60">
            <UserRound aria-hidden className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0 space-y-1">
            <h2 id="profile-heading" className="text-lg font-medium tracking-tight text-foreground">
              Profile &amp; security
            </h2>
            <p className="text-sm text-muted-foreground">
              Keep your phone, optional email, and name current. Use the link inside the form to
              rotate your password when you need to.
            </p>
          </div>
        </header>

        <div className="p-6 sm:p-8">
          <AccountForm />
        </div>
      </section>
    </div>
  )
}

export const metadata: Metadata = {
  description:
    'Manage your profile and password, and see recent orders—all in one place.',
  openGraph: mergeOpenGraph({
    title: 'Account',
    url: '/account',
  }),
  title: 'Account',
}
