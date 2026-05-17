import type { Order } from '@/payload-types'
import type { Metadata } from 'next'

import { OrderItem } from '@/components/OrderItem'
import { Button } from '@/components/ui/button'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { SHOP_BASE_PATH } from '@/utilities/shopPath'
import { ArrowRight, Package } from 'lucide-react'
import { headers as getHeaders } from 'next/headers'
import configPromise from '@payload-config'
import Link from 'next/link'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'

export default async function Orders() {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })

  let orders: Order[] | null = null

  if (!user) {
    redirect(`/login?warning=${encodeURIComponent('Please login to access your orders.')}`)
  }

  try {
    const ordersResult = await payload.find({
      collection: 'orders',
      limit: 0,
      pagination: false,
      user,
      overrideAccess: false,
      where: {
        customer: {
          equals: user?.id,
        },
      },
    })

    orders = ordersResult?.docs || []
  } catch (error) {}

  const hasOrders = Boolean(orders?.length)

  return (
    <section className="w-full min-w-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <header className="border-b border-border bg-muted/20 px-6 py-5 sm:px-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Orders</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {hasOrders
            ? 'Track status and totals for your purchases.'
            : 'Your order history will appear here after you check out.'}
        </p>
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
            <h2 className="text-base font-medium text-foreground">No orders yet</h2>
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
  )
}

export const metadata: Metadata = {
  description: 'Your orders.',
  openGraph: mergeOpenGraph({
    title: 'Orders',
    url: '/orders',
  }),
  title: 'Orders',
}
