import { syncReservationsForCart, withReservationLock } from '@/lib/inventory/reservations'
import { validateCartInventory } from '@/lib/inventory/validateCartInventory'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const body = (await request.json().catch(() => ({}))) as {
    cartId?: number
    district?: string
  }
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

  // Serialize validate→reserve so two concurrent checkouts can't both reserve
  // the last unit (oversell race). The lock is held for the whole section.
  return withReservationLock(payload, async () => {
    const validation = await validateCartInventory({
      cartId,
      district: typeof body.district === 'string' ? body.district : null,
      items: cart.items,
      payload,
    })

    if (!validation.ok) {
      return NextResponse.json(
        { error: validation.message, code: validation.code, ok: false },
        { status: 409 },
      )
    }

    await syncReservationsForCart({
      cartId,
      items: cart.items,
      payload,
    })

    return NextResponse.json({ ok: true })
  })
}
