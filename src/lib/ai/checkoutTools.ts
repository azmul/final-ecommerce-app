import { ecommerceCurrenciesConfig } from '@/lib/ecommerceCurrency'
import { getLoyaltyBalance } from '@/lib/loyalty/getLoyaltyBalance'
import {
  buildCartLinesFromItems,
  validatePromoForCart,
} from '@/lib/promoCodes/validatePromoForCart'
import { buildCheckoutShippingQuote } from '@/lib/shipping/cartShipmentQuote'
import { districtToDeliveryArea } from '@/lib/shipping/customerDeliveryPrefs'
import { loadCartForShipmentQuote } from '@/lib/shipping/loadCartForShipmentQuote'
import type { Cart } from '@/payload-types'
import type { Payload } from 'payload'

export type AiShoppingToolContext = {
  cartId?: number
  district?: string
  userEmail?: string
  userId?: number
}

export async function getShippingQuoteForAi(args: {
  payload: Payload
  cartId: number
  district: string
  deliveryType?: 'home' | 'point'
}): Promise<Record<string, unknown>> {
  const district = args.district.trim()
  if (!district) {
    return { error: 'District is required for a shipping quote.' }
  }

  const cart = await loadCartForShipmentQuote(args.payload, args.cartId)
  if (!cart) return { error: 'Cart not found.' }

  const quote = await buildCheckoutShippingQuote({
    cart,
    currency: ecommerceCurrenciesConfig.defaultCurrency,
    payload: args.payload,
    prefs: {
      area: districtToDeliveryArea(district),
      deliveryType: args.deliveryType === 'point' ? 'point' : 'home',
    },
  })

  if (!quote.ok) {
    return { error: quote.message }
  }

  return {
    currency: 'BDT',
    district,
    grandTotal: quote.grandTotalBdt,
    groups: quote.shipmentGroups.map((group) => ({
      itemCount: group.totalQuantity,
      shippingTotal: group.shippingTotalBdt,
      title: group.shipmentName,
    })),
    merchandiseSubtotal: quote.merchandiseSubtotalBdt,
    totalShipping: quote.totalShippingBdt,
  }
}

export async function checkPromoCodeForAi(args: {
  payload: Payload
  cart: Cart
  code: string
  userEmail?: string | null
  userId?: number | null
}): Promise<Record<string, unknown>> {
  const code = args.code.trim()
  if (!code) return { error: 'Promo code is required.' }

  const items = Array.isArray(args.cart.items) ? args.cart.items : []
  const lines = await buildCartLinesFromItems({
    currency: 'BDT',
    items,
    payload: args.payload,
    req: undefined,
  })
  const rawSubtotal = typeof args.cart.subtotal === 'number' ? args.cart.subtotal : 0

  const result = await validatePromoForCart({
    cartCustomerEmail:
      typeof (args.cart as { customerEmail?: string }).customerEmail === 'string' ?
        (args.cart as { customerEmail?: string }).customerEmail
      : null,
    codeInput: code,
    lines,
    payload: args.payload,
    rawCartSubtotal: rawSubtotal,
    req: undefined,
    userEmail: args.userEmail ?? null,
    userId: args.userId ?? null,
  })

  if (!result.ok) {
    return { code, message: result.message, valid: false }
  }

  return {
    code: result.normalizedCode,
    discountAmount: result.discountAmount,
    message: 'Promo code is valid for this cart.',
    valid: true,
  }
}

export async function getLoyaltyBalanceForAi(args: {
  payload: Payload
  userId: number
}): Promise<Record<string, unknown>> {
  const balance = await getLoyaltyBalance({ payload: args.payload, userId: args.userId })
  return { balance, currency: 'points', redeemNote: 'Points can be applied at checkout when signed in.' }
}

export function explainCheckoutStepForAi(step?: string): Record<string, unknown> {
  const normalized = (step ?? 'overview').toLowerCase()

  const steps: Record<string, string> = {
    overview:
      'Checkout steps: (1) contact info, (2) shipping address with district, (3) shipping method quote, (4) payment (card or cash on delivery), (5) order confirmation.',
    payment:
      'Payment options include card via Stripe and Cash on Delivery (COD). COD may require phone verification at delivery.',
    returns:
      'Return requests can be submitted from your order detail page after delivery. Keep product tags and packaging when possible.',
    shipping:
      'Shipping cost depends on district (Dhaka vs outside) and delivery type (home vs pickup point). Use getShippingQuote with your district.',
  }

  const key = Object.keys(steps).find((k) => normalized.includes(k)) ?? 'overview'
  return { explanation: steps[key], step: key }
}
