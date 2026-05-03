import type { Order } from '@/payload-types'
import type { Metadata } from 'next'

import { Price } from '@/components/Price'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/utilities/formatDateTime'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeftIcon } from 'lucide-react'
import { ProductItem } from '@/components/ProductItem'
import { headers as getHeaders } from 'next/headers.js'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { OrderStatus } from '@/components/OrderStatus'
import { AddressItem } from '@/components/addresses/AddressItem'
import { OrderPrintButton } from '@/components/orders/OrderPrintButton'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ email?: string; accessToken?: string }>
}

export default async function Order({ params, searchParams }: PageProps) {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })

  const { id } = await params
  const { email = '', accessToken = '' } = await searchParams

  let order: Order | null = null

  try {
    const {
      docs: [orderResult],
    } = await payload.find({
      collection: 'orders',
      user,
      overrideAccess: !Boolean(user),
      depth: 2,
      where: {
        and: [
          {
            id: {
              equals: id,
            },
          },
          ...(user
            ? [
                {
                  customer: {
                    equals: user.id,
                  },
                },
              ]
            : [
                {
                  accessToken: {
                    equals: accessToken,
                  },
                },
                ...(email
                  ? [
                      {
                        customerEmail: {
                          equals: email,
                        },
                      },
                    ]
                  : []),
              ]),
        ],
      },
      select: {
        amount: true,
        currency: true,
        items: true,
        customerFullName: true,
        customerPhone: true,
        customerEmail: true,
        customer: true,
        status: true,
        statusTimeline: true,
        createdAt: true,
        updatedAt: true,
        shippingAddress: true,
      },
    })

    const canAccessAsGuest =
      !user &&
      email &&
      accessToken &&
      orderResult &&
      orderResult.customerEmail &&
      orderResult.customerEmail === email
    const canAccessAsUser =
      user &&
      orderResult &&
      orderResult.customer &&
      (typeof orderResult.customer === 'object'
        ? orderResult.customer.id
        : orderResult.customer) === user.id

    if (orderResult && (canAccessAsGuest || canAccessAsUser)) {
      order = orderResult
    }
  } catch {
    /* Access denied or lookup failed — show not found */
  }

  if (!order) {
    notFound()
  }

  const statusTimeline =
    order.statusTimeline?.filter((update) => update.status && update.updatedAt) ?? []

  const generatedAtLabel = new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date())

  return (
    <div className="min-w-0">
      <div className="mb-6 flex w-full min-w-0 flex-col gap-4 print:hidden">
        {user && (
          <Button asChild variant="ghost" className="print:hidden w-fit -ml-2 sm:ml-0">
            <Link href="/orders">
              <ChevronLeftIcon />
              All orders
            </Link>
          </Button>
        )}

        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
          <h1 className="min-w-0 max-w-full wrap-break-word text-sm uppercase font-mono px-2 py-1 bg-primary/10 rounded tracking-[0.07em] sm:max-w-[min(100%,28rem)]">
            <span>{`Order #${order.id}`}</span>
          </h1>
          <OrderPrintButton />
        </div>
      </div>

      <div
        id="order-print-content"
        data-order-id={order.id}
        className="bg-card border rounded-lg px-4 py-4 sm:px-6 flex flex-col gap-8 sm:gap-12 min-w-0"
      >
        <div className="hidden print:block border-b border-neutral-300 pb-4 mb-2 dark:border-neutral-600 print:border-neutral-300">
          <p className="font-mono uppercase text-xs tracking-widest text-neutral-600">
            Order receipt
          </p>
          <p className="text-2xl font-semibold text-neutral-900 mt-1 print:text-neutral-900">{`Order #${order.id}`}</p>
          <p className="text-sm text-neutral-600 mt-2">{`Generated ${generatedAtLabel}`}</p>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row lg:justify-between lg:gap-8">
          <div className="min-w-0">
            <p className="font-mono uppercase text-primary/50 mb-1 text-sm">Order Date</p>
            <p className="text-base sm:text-lg">
              <time dateTime={order.createdAt}>
                {formatDateTime({ date: order.createdAt, format: 'MMMM dd, yyyy' })}
              </time>
            </p>
          </div>

          <div className="min-w-0">
            <p className="font-mono uppercase text-primary/50 mb-1 text-sm">Total</p>
            {order.amount && <Price className="text-base sm:text-lg" amount={order.amount} />}
          </div>

          {order.status && (
            <div className="min-w-0 w-full lg:max-w-sm lg:shrink-0">
              <p className="font-mono uppercase text-primary/50 mb-1 text-sm">Status</p>
              <OrderStatus className="text-sm" status={order.status} />
            </div>
          )}
        </div>

        {statusTimeline.length > 0 && (
          <div>
            <h2 className="font-mono text-primary/50 mb-4 uppercase text-sm">Status Timeline</h2>
            <ol className="flex flex-col gap-4">
              {statusTimeline.map((update, index) => {
                if (!update.status || !update.updatedAt) {
                  return null
                }

                return (
                  <li
                    key={update.id ?? `${update.status}-${update.updatedAt}`}
                    className="flex gap-4"
                  >
                    <div className="flex flex-col items-center">
                      <div className="bg-primary/10 text-xs font-mono rounded-full size-6 flex items-center justify-center">
                        {index + 1}
                      </div>
                      {index < statusTimeline.length - 1 && (
                        <div className="bg-border w-px grow min-h-4 mt-2" />
                      )}
                    </div>

                    <div className="flex flex-col gap-2 pb-2">
                      <OrderStatus status={update.status} />
                      <time className="text-sm text-primary/70" dateTime={update.updatedAt}>
                        {formatDateTime({
                          date: update.updatedAt,
                          format: "MMMM dd, yyyy 'at' h:mm a",
                        })}
                      </time>
                    </div>
                  </li>
                )
              })}
            </ol>
          </div>
        )}

        {(order.customerFullName || order.customerPhone) && (
          <div>
            <h2 className="font-mono text-primary/50 mb-4 uppercase text-sm">Customer Details</h2>
            <dl className="grid gap-3 sm:grid-cols-2">
              {order.customerFullName && (
                <div>
                  <dt className="text-sm text-primary/60">Full Name</dt>
                  <dd>{order.customerFullName}</dd>
                </div>
              )}
              {order.customerPhone && (
                <div>
                  <dt className="text-sm text-primary/60">Phone Number</dt>
                  <dd>{order.customerPhone}</dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {order.items && (
          <div>
            <h2 className="font-mono text-primary/50 mb-4 uppercase text-sm">Items</h2>
            <ul className="flex flex-col gap-6">
              {order.items?.map((item, index) => {
                if (typeof item.product === 'string') {
                  return null
                }

                if (!item.product || typeof item.product !== 'object') {
                  return <div key={index}>This item is no longer available.</div>
                }

                const variant =
                  item.variant && typeof item.variant === 'object' ? item.variant : undefined

                return (
                  <li key={item.id}>
                    <ProductItem
                      product={item.product}
                      quantity={item.quantity}
                      variant={variant}
                    />
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {order.shippingAddress && (
          <div>
            <h2 className="font-mono text-primary/50 mb-4 uppercase text-sm">Shipping Address</h2>

            <AddressItem address={order.shippingAddress} hideActions />
          </div>
        )}
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params

  return {
    description: `Order details for order ${id}.`,
    openGraph: mergeOpenGraph({
      title: `Order ${id}`,
      url: `/orders/${id}`,
    }),
    title: `Order ${id}`,
  }
}
