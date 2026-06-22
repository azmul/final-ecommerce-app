import type { Metadata } from 'next'
import { Suspense } from 'react'

import { LogOut } from 'lucide-react'
import Link from 'next/link'
import { headers as getHeaders } from 'next/headers.js'
import configPromise from '@payload-config'

import { AccountPageTabs } from '@/components/account/AccountPageTabs'
import { Button } from '@/components/ui/button'
import type { Order, User } from '@/payload-types'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'

import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
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

type PageProps = {
  searchParams: Promise<{ tab?: string }>
}

export default async function AccountPage({ searchParams }: PageProps) {
  const { tab } = await searchParams
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })

  let orders: Order[] = []

  if (!user) {
    redirect(
      `/login?warning=${encodeURIComponent('Please login to access your account settings.')}`,
    )
  }

  await ensureNotificationPreferences(payload, user.id)

  try {
    const ordersResult = await payload.find({
      collection: 'orders',
      // Bound the result (was limit:0 = fetch ALL of a user's orders).
      limit: 100,
      user,
      overrideAccess: false,
      pagination: true,
      sort: '-createdAt',
      where: {
        customer: {
          equals: user.id,
        },
      },
    })

    orders = ordersResult?.docs || []
  } catch (_error) {
    // Template may build before APIs are live; render with empty orders where needed.
  }

  const firstName = accountGreetingFirstName(user)
  const initials = accountInitials(user)

  return (
    <div className="flex flex-col gap-8">
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
                Manage your profile, orders, addresses, notifications, and rewards from the tabs
                below.
              </p>
            </div>
          </div>
          <Button asChild variant="ghost" size="sm" className="text-muted-foreground sm:hidden">
            <Link href="/logout" className="gap-2">
              <LogOut aria-hidden className="h-3.5 w-3.5" />
              Log out
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="hidden text-muted-foreground sm:inline-flex">
            <Link href="/logout" className="gap-2">
              <LogOut aria-hidden className="h-3.5 w-3.5" />
              Log out
            </Link>
          </Button>
        </div>
      </section>

      <Suspense
        fallback={
          <div className="rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground">
            Loading account…
          </div>
        }
      >
        <AccountPageTabs initialTab={tab} orders={orders} />
      </Suspense>
    </div>
  )
}

export const metadata: Metadata = {
  description:
    'Manage your profile, orders, addresses, notifications, and rewards in one place.',
  openGraph: mergeOpenGraph({
    title: 'Account',
    url: '/account',
  }),
  title: 'Account',
}
