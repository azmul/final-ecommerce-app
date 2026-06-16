import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: request.headers })

  if (!user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }

  const [orders, wishlist, addresses, notifications] = await Promise.all([
    payload.find({
      collection: 'orders',
      depth: 0,
      limit: 100,
      overrideAccess: true,
      sort: '-createdAt',
      where: { customer: { equals: user.id } },
    }),
    payload.find({
      collection: 'wishlists',
      depth: 1,
      limit: 1,
      overrideAccess: true,
      where: { customer: { equals: user.id } },
    }),
    payload.find({
      collection: 'addresses',
      depth: 0,
      limit: 50,
      overrideAccess: true,
      where: { customer: { equals: user.id } },
    }),
    payload.find({
      collection: 'user-notifications',
      depth: 0,
      limit: 100,
      overrideAccess: true,
      sort: '-createdAt',
      where: { user: { equals: user.id } },
    }),
  ])

  const exportData = {
    exportedAt: new Date().toISOString(),
    profile: {
      email: user.email,
      id: user.id,
      name: user.name,
      phone: user.phone,
    },
    addresses: addresses.docs,
    notifications: notifications.docs,
    orders: orders.docs,
    wishlist: wishlist.docs[0] ?? null,
  }

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Disposition': `attachment; filename="account-export-${user.id}.json"`,
      'Content-Type': 'application/json',
    },
  })
}
