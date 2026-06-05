import {
  LOYALTY_MIN_REDEEM,
  LOYALTY_POINT_VALUE_BDT,
  pointsToDiscountBdt,
} from '@/lib/loyalty/config'
import { getLoyaltyBalance } from '@/lib/loyalty/getLoyaltyBalance'
import type { User } from '@/payload-types'
import type { CollectionBeforeChangeHook } from 'payload'
import { APIError } from 'payload'

export const loyaltyCartBeforeChange: CollectionBeforeChangeHook = async ({
  data,
  req,
  originalDoc,
}) => {
  const loyaltyTouched = Object.prototype.hasOwnProperty.call(data, 'appliedLoyaltyPoints')
  const nextPointsRaw = loyaltyTouched ?
    data.appliedLoyaltyPoints
  : originalDoc?.appliedLoyaltyPoints

  const payableSubtotal =
    typeof data.subtotal === 'number' && Number.isFinite(data.subtotal) ?
      data.subtotal
    : typeof originalDoc?.subtotal === 'number' ?
      originalDoc.subtotal
    : 0

  if (
    nextPointsRaw === null ||
    nextPointsRaw === undefined ||
    (typeof nextPointsRaw === 'number' && nextPointsRaw <= 0)
  ) {
    data.appliedLoyaltyPoints = null
    data.loyaltyDiscountAmount = null
    return data
  }

  const points = Math.floor(Number(nextPointsRaw))
  if (!Number.isFinite(points) || points < LOYALTY_MIN_REDEEM) {
    if (loyaltyTouched) {
      throw new APIError(`Redeem at least ${LOYALTY_MIN_REDEEM} points.`, 400)
    }
    data.appliedLoyaltyPoints = null
    data.loyaltyDiscountAmount = null
    return data
  }

  const user = req.user as User | undefined
  if (!user?.id) {
    if (loyaltyTouched) {
      throw new APIError('Sign in to use loyalty points.', 401)
    }
    data.appliedLoyaltyPoints = null
    data.loyaltyDiscountAmount = null
    return data
  }

  const balance = await getLoyaltyBalance({ payload: req.payload, req, userId: user.id })
  if (points > balance) {
    if (loyaltyTouched) {
      throw new APIError('Not enough loyalty points.', 400)
    }
    data.appliedLoyaltyPoints = null
    data.loyaltyDiscountAmount = null
    return data
  }

  const maxDiscount = pointsToDiscountBdt(points)
  const discount = Math.min(maxDiscount, payableSubtotal)
  const pointsUsed = Math.floor(discount / LOYALTY_POINT_VALUE_BDT)

  data.appliedLoyaltyPoints = pointsUsed
  data.loyaltyDiscountAmount = discount
  data.subtotal = Math.max(0, payableSubtotal - discount)

  return data
}
