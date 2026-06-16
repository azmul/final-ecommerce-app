import { syncReservationsForCart } from '@/lib/inventory/reservations'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const body = (await request.json().catch(() => ({}))) as { cartId?: number }
  const cartId = typeof body.cartId === 'number' ? body.cartId : null

  if (!cartId) {
    return NextResponse.json({ error: 'cartId is required.' }, { status: 400 })
  }

  const cart = await payload.findByID({
    id: cartId,
    collection: 'carts',
    depth: 1,
    overrideAccess: true,
  })

  if (!cart) {
    return NextResponse.json({ error: 'Cart not found.' }, { status: 404 })
  }

  await syncReservationsForCart({
    cartId,
    items: cart.items,
    payload,
  })

  return NextResponse.json({ ok: true })
}
