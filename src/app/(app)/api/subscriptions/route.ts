import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })

  const result = await payload.find({
    collection: 'subscriptions',
    depth: 0,
    limit: 20,
    overrideAccess: true,
    sort: '-createdAt',
    where: { user: { equals: user.id } },
  })

  return NextResponse.json({ docs: result.docs })
}

export async function POST(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })

  const body = (await request.json().catch(() => ({}))) as {
    intervalDays?: unknown
    items?: { product: number; quantity: number; variant?: number }[]
    shippingAddress?: { district: string; fullAddress: string }
  }

  if (!body.items?.length || !body.shippingAddress?.district || !body.shippingAddress.fullAddress) {
    return NextResponse.json({ error: 'items and shippingAddress are required.' }, { status: 400 })
  }

  const intervalDays = Number(body.intervalDays) || 30
  const nextOrderAt = new Date()
  nextOrderAt.setDate(nextOrderAt.getDate() + intervalDays)

  const created = await payload.create({
    collection: 'subscriptions',
    data: {
      active: true,
      intervalDays,
      items: body.items,
      nextOrderAt: nextOrderAt.toISOString(),
      shippingAddress: body.shippingAddress,
      user: user.id,
    },
    overrideAccess: true,
  })

  return NextResponse.json({ doc: created })
}

export async function PATCH(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: request.headers })
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })

  const body = (await request.json().catch(() => ({}))) as { active?: boolean; id?: number }
  if (!body.id) return NextResponse.json({ error: 'id is required.' }, { status: 400 })

  const sub = await payload.findByID({
    id: body.id,
    collection: 'subscriptions',
    depth: 0,
    overrideAccess: true,
  })

  const owner =
    typeof sub?.user === 'object' && sub.user ? sub.user.id : sub?.user
  if (owner !== user.id) return NextResponse.json({ error: 'Not found.' }, { status: 404 })

  const updated = await payload.update({
    id: body.id,
    collection: 'subscriptions',
    data: { active: body.active === false ? false : true },
    overrideAccess: true,
  })

  return NextResponse.json({ doc: updated })
}
