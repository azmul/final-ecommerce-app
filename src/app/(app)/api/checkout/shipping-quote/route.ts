import configPromise from '@payload-config'
import { ecommerceCurrenciesConfig } from '@/lib/ecommerceCurrency'
import { buildCheckoutShippingQuote } from '@/lib/shipping/cartShipmentQuote'
import { districtToDeliveryArea } from '@/lib/shipping/customerDeliveryPrefs'
import type { CustomerDeliveryPrefs } from '@/lib/shipping/customerDeliveryPrefs'
import { loadCartForShipmentQuote } from '@/lib/shipping/loadCartForShipmentQuote'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

type Body = {
  cartID?: unknown
  secret?: unknown
  district?: unknown
  deliveryType?: unknown
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export async function POST(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const auth = await payload.auth({ headers: request.headers })

  let body: Body = {}
  try {
    body = (await request.json()) as Body
  } catch {
    return jsonError('Invalid JSON.', 400)
  }

  const cartID = typeof body.cartID === 'number' ? body.cartID : Number(body.cartID)
  const secret = typeof body.secret === 'string' ? body.secret : undefined

  const deliveryTypeRaw = body.deliveryType
  const deliveryType: CustomerDeliveryPrefs['deliveryType'] =
    deliveryTypeRaw === 'point' ? 'point' : 'home'

  const district = typeof body.district === 'string' ? body.district : ''
  if (!district.trim()) {
    return jsonError('District is required to quote shipping.', 400)
  }

  const prefs: CustomerDeliveryPrefs = {
    area: districtToDeliveryArea(district),
    deliveryType,
  }

  if (!Number.isFinite(cartID) || cartID < 1) {
    return jsonError('Valid cartID is required.', 400)
  }

  const cartSurface = await payload.findByID({
    id: cartID,
    collection: 'carts',
    depth: 0,
    overrideAccess: true,
  })

  if (!cartSurface || typeof cartSurface !== 'object' || !('id' in cartSurface)) {
    return jsonError('Cart not found.', 404)
  }

  const cartCustomer =
    typeof (cartSurface as { customer?: unknown }).customer === 'number' ?
      (cartSurface as { customer: number }).customer
    : typeof (cartSurface as { customer?: { id?: number } }).customer === 'object' ?
      ((cartSurface as { customer?: { id?: number } }).customer?.id ?? null)
    : null

  const cartSecret = typeof (cartSurface as { secret?: unknown }).secret === 'string' ?
    (cartSurface as { secret: string }).secret
  : ''

  const userId =
    auth.user && typeof auth.user.id === 'number' ? auth.user.id
    : auth.user && typeof auth.user === 'object' && 'id' in auth.user ?
      Number((auth.user as { id: number }).id)
    : null

  if (userId != null) {
    if (cartCustomer != null && cartCustomer !== userId) {
      return jsonError('You do not have access to this cart.', 403)
    }
    if (cartCustomer == null && (!secret || secret !== cartSecret)) {
      return jsonError('Valid cart secret is required for this cart.', 403)
    }
  } else {
    if (!secret || secret !== cartSecret) {
      return jsonError('Valid cart secret is required for guest checkout.', 403)
    }
  }

  const currency =
    typeof (cartSurface as { currency?: string }).currency === 'string' ?
      (cartSurface as { currency: string }).currency
    : ecommerceCurrenciesConfig.defaultCurrency

  const cart = await loadCartForShipmentQuote(payload, cartID)

  if (!cart) {
    return jsonError('Unable to load cart.', 404)
  }

  const quote = await buildCheckoutShippingQuote({
    cart: cart as never,
    currency,
    prefs,
    payload,
  })

  return NextResponse.json({ quote })
}
