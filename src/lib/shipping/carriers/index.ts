export type CarrierId = 'steadfast' | 'pathao' | 'redx'

export type CreateCarrierShipmentInput = {
  carrier: CarrierId
  consigneeAddress: string
  consigneeName: string
  consigneePhone: string
  orderId: number
  quantity?: number
  weightKg?: number
}

export type CreateCarrierShipmentResult =
  | { ok: true; carrier: CarrierId; trackingNumber: string; raw?: unknown }
  | { ok: false; error: string }

async function createSteadfastShipment(
  input: CreateCarrierShipmentInput,
): Promise<CreateCarrierShipmentResult> {
  const apiKey = process.env.STEADFAST_API_KEY
  const secretKey = process.env.STEADFAST_SECRET_KEY

  if (!apiKey || !secretKey) {
    return { ok: false, error: 'Steadfast API credentials are not configured.' }
  }

  const res = await fetch('https://portal.packzy.com/api/v1/create_order', {
    body: JSON.stringify({
      consignment_note: `Order #${input.orderId}`,
      invoice: String(input.orderId),
      recipient_address: input.consigneeAddress,
      recipient_name: input.consigneeName,
      recipient_phone: input.consigneePhone,
    }),
    headers: {
      'Api-Key': apiKey,
      'Content-Type': 'application/json',
      'Secret-Key': secretKey,
    },
    method: 'POST',
  })

  const body = (await res.json().catch(() => ({}))) as {
    consignment?: { tracking_code?: string }
    message?: string
  }

  if (!res.ok) {
    return { ok: false, error: body.message || 'Steadfast booking failed.' }
  }

  const trackingNumber = body.consignment?.tracking_code?.trim()
  if (!trackingNumber) {
    return { ok: false, error: 'Steadfast did not return a tracking number.' }
  }

  return { ok: true, carrier: 'steadfast', raw: body, trackingNumber }
}

/** Env-gated carrier booking helpers for Bangladesh couriers. */
export async function createCarrierShipment(
  input: CreateCarrierShipmentInput,
): Promise<CreateCarrierShipmentResult> {
  switch (input.carrier) {
    case 'steadfast':
      return createSteadfastShipment(input)
    case 'pathao':
      return {
        ok: false,
        error: 'Pathao API integration is not configured. Set PATHAO credentials or enter tracking manually.',
      }
    case 'redx':
      return {
        ok: false,
        error: 'RedX API integration is not configured. Set REDX credentials or enter tracking manually.',
      }
    default:
      return { ok: false, error: 'Unsupported carrier.' }
  }
}
