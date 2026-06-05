/** Points earned per 1 BDT spent (1 point per ৳100 = 0.01). */
export const LOYALTY_EARN_RATE = Number(process.env.LOYALTY_EARN_RATE ?? '0.01')

/** BDT discount value of one loyalty point. */
export const LOYALTY_POINT_VALUE_BDT = Number(process.env.LOYALTY_POINT_VALUE_BDT ?? '1')

/** Minimum points required to redeem at checkout. */
export const LOYALTY_MIN_REDEEM = Number(process.env.LOYALTY_MIN_REDEEM ?? '50')

export function pointsToDiscountBdt(points: number): number {
  if (!Number.isFinite(points) || points <= 0) return 0
  return Math.floor(points) * LOYALTY_POINT_VALUE_BDT
}

export function orderAmountToEarnedPoints(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0
  return Math.floor(amount * LOYALTY_EARN_RATE)
}
