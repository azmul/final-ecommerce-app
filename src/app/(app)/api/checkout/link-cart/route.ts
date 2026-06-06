import configPromise from '@payload-config'
import { constantTimeEquals } from '@/utilities/edgeRateLimit'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

type Body = {
  cartID?: unknown
  secret?: unknown
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export async function POST(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const auth = await payload.auth({ headers: request.headers })

  const userId =
    auth.user && typeof auth.user.id === 'number' ? auth.user.id
    : auth.user && typeof auth.user === 'object' && 'id' in auth.user ?
      Number((auth.user as { id: number }).id)
    : null

  if (userId == null) {
    return jsonError('You must be logged in to link a cart.', 401)
  }

  let body: Body = {}
  try {
    body = (await request.json()) as Body
  } catch {
    return jsonError('Invalid JSON.', 400)
  }

  const cartID = typeof body.cartID === 'number' ? body.cartID : Number(body.cartID)
  const secret = typeof body.secret === 'string' ? body.secret.trim() : ''

  if (!Number.isFinite(cartID) || cartID < 1) {
    return jsonError('Valid cartID is required.', 400)
  }

  const cart = await payload.findByID({
    id: cartID,
    collection: 'carts',
    depth: 0,
    overrideAccess: true,
  })

  if (!cart || typeof cart !== 'object' || !('id' in cart)) {
    return jsonError('Cart not found.', 404)
  }

  const cartCustomer =
    typeof (cart as { customer?: unknown }).customer === 'number' ?
      (cart as { customer: number }).customer
    : typeof (cart as { customer?: { id?: number } }).customer === 'object' ?
      ((cart as { customer?: { id?: number } }).customer?.id ?? null)
    : null

  if (cartCustomer != null && cartCustomer !== userId) {
    return jsonError('You do not have access to this cart.', 403)
  }

  if (cartCustomer == null) {
    const cartSecret =
      typeof (cart as { secret?: unknown }).secret === 'string' ?
        (cart as { secret: string }).secret
      : ''

    if (!secret || !cartSecret || !constantTimeEquals(secret, cartSecret)) {
      return jsonError('Valid cart secret is required to link this cart.', 403)
    }
  }

  const updated = await payload.update({
    id: cartID,
    collection: 'carts',
    data: {
      customer: userId,
      secret: null,
    },
    depth: 0,
    overrideAccess: true,
  })

  return NextResponse.json({ cart: updated, ok: true })
}
