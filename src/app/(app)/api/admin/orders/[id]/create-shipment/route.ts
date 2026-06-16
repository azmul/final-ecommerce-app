import { createCarrierShipment, type CarrierId } from '@/lib/shipping/carriers'
import { logAdminAudit } from '@/lib/admin/logAdminAudit'
import { hasStaffPermission } from '@/lib/permissions/check'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params
  const orderId = Number(id)
  if (!Number.isFinite(orderId)) {
    return NextResponse.json({ error: 'Invalid order id.' }, { status: 400 })
  }

  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: request.headers })

  if (!user || !hasStaffPermission(user, 'orders', 'edit')) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
  }

  const body = (await request.json().catch(() => ({}))) as { carrier?: CarrierId }
  const carrier = body.carrier
  if (!carrier || !['steadfast', 'pathao', 'redx'].includes(carrier)) {
    return NextResponse.json({ error: 'A valid carrier is required.' }, { status: 400 })
  }

  const order = await payload.findByID({
    id: orderId,
    collection: 'orders',
    depth: 0,
    overrideAccess: true,
  })

  if (!order) {
    return NextResponse.json({ error: 'Order not found.' }, { status: 404 })
  }

  const shippingAddress = order.shippingAddress as
    | { district?: string; fullAddress?: string }
    | undefined

  const result = await createCarrierShipment({
    carrier,
    consigneeAddress: shippingAddress?.fullAddress || shippingAddress?.district || 'Bangladesh',
    consigneeName: order.customerFullName || 'Customer',
    consigneePhone: order.customerPhone || '',
    orderId,
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 })
  }

  const updated = await payload.update({
    id: orderId,
    collection: 'orders',
    data: {
      fulfillment: {
        ...(typeof order.fulfillment === 'object' && order.fulfillment ? order.fulfillment : {}),
        carrier,
        trackingNumber: result.trackingNumber,
      },
    },
    overrideAccess: true,
  })

  await logAdminAudit({
    action: 'create_carrier_shipment',
    collection: 'orders',
    documentId: orderId,
    metadata: { carrier, trackingNumber: result.trackingNumber },
    payload,
    summary: `Booked ${carrier} shipment for order #${orderId}`,
  })

  return NextResponse.json({ doc: updated, trackingNumber: result.trackingNumber })
}
