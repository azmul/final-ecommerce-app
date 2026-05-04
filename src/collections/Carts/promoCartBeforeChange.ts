import { buildCartLinesFromItems, validatePromoForCart } from '@/lib/promoCodes/validatePromoForCart'
import type { User } from '@/payload-types'
import type { CollectionBeforeChangeHook } from 'payload'
import { APIError } from 'payload'

/**
 * Runs after the ecommerce plugin recalculates `subtotal` from line items.
 * Adjusts `subtotal` to the payable total and maintains promo snapshot fields.
 */
export const promoCartBeforeChange: CollectionBeforeChangeHook = async ({
  data,
  req,
  originalDoc,
}) => {
  const payload = req.payload
  const items =
    data.items !== undefined ? data.items : (originalDoc?.items as typeof data.items | undefined)
  const currency = (data.currency ?? originalDoc?.currency ?? 'BDT') as string

  const promoTouched = Object.prototype.hasOwnProperty.call(data, 'appliedPromoCode')
  const nextPromoRaw = promoTouched ? data.appliedPromoCode : originalDoc?.appliedPromoCode

  if (!items || !Array.isArray(items) || items.length === 0) {
    data.items = []
    data.appliedPromoCode = null
    data.promoCode = null
    data.promoDiscountAmount = null
    data.subtotalBeforeDiscount = null
    data.subtotal = 0
    return data
  }

  const rawSubtotal = typeof data.subtotal === 'number' && Number.isFinite(data.subtotal) ? data.subtotal : 0
  const lines = await buildCartLinesFromItems({
    payload,
    req,
    items,
    currency,
  })

  const user = req.user as User | undefined
  const userId = typeof user?.id === 'number' ? user.id : null
  const userEmail = typeof user?.email === 'string' ? user.email : null

  const explicitApply =
    promoTouched &&
    typeof nextPromoRaw === 'string' &&
    nextPromoRaw.trim().length > 0

  if (
    nextPromoRaw === null ||
    nextPromoRaw === undefined ||
    (typeof nextPromoRaw === 'string' && !nextPromoRaw.trim())
  ) {
    data.appliedPromoCode = null
    data.promoCode = null
    data.promoDiscountAmount = null
    data.subtotalBeforeDiscount = null
    data.subtotal = rawSubtotal
    return data
  }

  if (typeof nextPromoRaw !== 'string') {
    data.appliedPromoCode = null
    data.promoCode = null
    data.promoDiscountAmount = null
    data.subtotalBeforeDiscount = null
    data.subtotal = rawSubtotal
    return data
  }

  const result = await validatePromoForCart({
    payload,
    req,
    codeInput: nextPromoRaw,
    rawCartSubtotal: rawSubtotal,
    lines,
    userId,
    userEmail,
  })

  if (!result.ok) {
    if (explicitApply) {
      throw new APIError(result.message, 400)
    }
    data.appliedPromoCode = null
    data.promoCode = null
    data.promoDiscountAmount = null
    data.subtotalBeforeDiscount = null
    data.subtotal = rawSubtotal
    return data
  }

  data.appliedPromoCode = result.normalizedCode
  data.promoCode = result.promoId
  data.promoDiscountAmount = result.discountAmount
  data.subtotalBeforeDiscount = rawSubtotal
  data.subtotal = Math.max(0, rawSubtotal - result.discountAmount)

  return data
}
