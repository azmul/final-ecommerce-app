import { validateGiftCardForCart } from '@/lib/giftCards/validateGiftCardForCart'
import type { CollectionBeforeChangeHook } from 'payload'
import { APIError } from 'payload'

export const giftCardCartBeforeChange: CollectionBeforeChangeHook = async ({
  data,
  req,
  originalDoc,
}) => {
  const giftTouched = Object.prototype.hasOwnProperty.call(data, 'appliedGiftCardCode')
  const nextGiftRaw = giftTouched ? data.appliedGiftCardCode : originalDoc?.appliedGiftCardCode

  const payableSubtotal =
    typeof data.subtotal === 'number' && Number.isFinite(data.subtotal) ?
      data.subtotal
    : typeof originalDoc?.subtotal === 'number' ?
      originalDoc.subtotal
    : 0

  if (
    nextGiftRaw === null ||
    nextGiftRaw === undefined ||
    (typeof nextGiftRaw === 'string' && !nextGiftRaw.trim())
  ) {
    data.appliedGiftCardCode = null
    data.giftCard = null
    data.giftCardDiscountAmount = null
    return data
  }

  if (typeof nextGiftRaw !== 'string') {
    data.appliedGiftCardCode = null
    data.giftCard = null
    data.giftCardDiscountAmount = null
    return data
  }

  const explicitApply = giftTouched && nextGiftRaw.trim().length > 0

  const result = await validateGiftCardForCart({
    codeInput: nextGiftRaw,
    payableSubtotal,
    payload: req.payload,
    req,
  })

  if (!result.ok) {
    if (explicitApply) throw new APIError(result.message, 400)
    data.appliedGiftCardCode = null
    data.giftCard = null
    data.giftCardDiscountAmount = null
    return data
  }

  data.appliedGiftCardCode = result.normalizedCode
  data.giftCard = result.giftCardId
  data.giftCardDiscountAmount = result.redeemAmount
  data.subtotal = Math.max(0, payableSubtotal - result.redeemAmount)

  return data
}
