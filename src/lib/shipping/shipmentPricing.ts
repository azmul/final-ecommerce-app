import type { Shipment } from '@/payload-types'

import type { CustomerDeliveryPrefs } from '@/lib/shipping/customerDeliveryPrefs'

export type ShipmentChargeLine = {
  label: string
  amountBdt: number
}

export type ShipmentGroupQuote = {
  shipmentId: number | null
  shipmentName: string | null
  quantity: number
  baseChargeBdt: number
  cumulativeChargeBdt: number
  cumulativeSteps: number
  freeDelivery: boolean
  lines: ShipmentChargeLine[]
  totalBdt: number
}

export function computeChargesForShipmentGroup(args: {
  shipment: Shipment | null
  totalQuantity: number
  prefs: CustomerDeliveryPrefs
}): Omit<ShipmentGroupQuote, 'shipmentId' | 'shipmentName' | 'quantity'> & {
  lines: ShipmentChargeLine[]
  totalBdt: number
} {
  const { shipment, totalQuantity, prefs } = args
  const qty = Math.max(0, Math.floor(Number(totalQuantity)))

  if (!shipment?.id) {
    return {
      baseChargeBdt: 0,
      cumulativeChargeBdt: 0,
      cumulativeSteps: 0,
      freeDelivery: false,
      lines: [],
      totalBdt: 0,
    }
  }

  const name = shipment.shippingName ?? null

  if (shipment.freeDelivery) {
    return {
      baseChargeBdt: 0,
      cumulativeChargeBdt: 0,
      cumulativeSteps: 0,
      freeDelivery: true,
      lines: [
        {
          label: `${name ?? 'Shipment'} — free delivery`,
          amountBdt: 0,
        },
      ],
      totalBdt: 0,
    }
  }

  let base = 0
  if (prefs.area === 'dhaka') {
    base =
      prefs.deliveryType === 'home' ?
        Number(shipment.dhakaHomeDeliveryCharge ?? 0)
      : Number(shipment.dhakaPointDeliveryCharge ?? 0)
  } else {
    base =
      prefs.deliveryType === 'home' ?
        Number(shipment.outsideDhakaHomeDeliveryCharge ?? 0)
      : Number(shipment.outsideDhakaPointDeliveryCharge ?? 0)
  }

  if (!Number.isFinite(base)) base = 0
  base = Math.max(0, base)

  const cumulativeCount =
    typeof shipment.cumulativeCount === 'number' && Number.isFinite(shipment.cumulativeCount) ?
      Math.floor(shipment.cumulativeCount)
    : null

  let extraPerStep =
    typeof shipment.cumulativeCharge === 'number' && Number.isFinite(shipment.cumulativeCharge) ?
      Math.max(0, shipment.cumulativeCharge)
    : 0

  const steps =
    cumulativeCount !== null &&
    cumulativeCount >= 1 &&
    extraPerStep > 0 &&
    qty >= cumulativeCount ?
      Math.floor(qty / cumulativeCount)
    : 0

  let cumulativeTotal = steps * extraPerStep
  if (!Number.isFinite(cumulativeTotal)) cumulativeTotal = 0

  const areaLabel = prefs.area === 'dhaka' ? 'Dhaka' : 'Outside Dhaka'
  const modeLabel = prefs.deliveryType === 'home' ? 'Home delivery' : 'Point delivery'

  const lines: ShipmentChargeLine[] = []

  lines.push({
    label: `${name ?? 'Shipment'} — base (${areaLabel}, ${modeLabel})`,
    amountBdt: Math.round(base * 100) / 100,
  })

  if (steps > 0 && cumulativeCount !== null && extraPerStep > 0) {
    lines.push({
      label: `${name ?? 'Shipment'} — cumulative (×${steps} × ৳${extraPerStep} per ${cumulativeCount} pcs)`,
      amountBdt: Math.round(cumulativeTotal * 100) / 100,
    })
  }

  const totalBdt =
    Math.round((Math.round(base * 100) / 100 + Math.round(cumulativeTotal * 100) / 100) * 100) / 100

  return {
    baseChargeBdt: Math.round(base * 100) / 100,
    cumulativeChargeBdt: Math.round(cumulativeTotal * 100) / 100,
    cumulativeSteps: steps,
    freeDelivery: false,
    lines,
    totalBdt,
  }
}
