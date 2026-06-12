import type { Payload } from 'payload'

export type ActivePromoSummary = {
  code: string
  discountLabel: string
  minOrderSubtotal?: number | null
  validUntil?: string | null
}

type PromoDoc = {
  id: number
  code?: string | null
  active?: boolean | null
  validFrom?: string | null
  validUntil?: string | null
  discountType?: 'percentage' | 'fixed' | null
  discountFixedAmount?: number | null
  discountPercentage?: number | null
  minOrderSubtotal?: number | null
  maxRedemptionsTotal?: number | null
  maxRedemptionsPerUser?: number | null
  firstTimeCustomersOnly?: boolean | null
  allowedEmailDomains?: string | null
  timesRedeemed?: number | null
}

function formatDiscountLabel(promo: PromoDoc): string {
  if (promo.discountType === 'fixed' && typeof promo.discountFixedAmount === 'number') {
    return `${promo.discountFixedAmount} BDT off`
  }
  if (typeof promo.discountPercentage === 'number') {
    return `${promo.discountPercentage}% off`
  }
  return 'Discount available'
}

function parseEmailDomains(text: string | null | undefined): string[] {
  if (!text?.trim()) return []
  return text
    .split(/[\n,]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
}

function extractEmailDomain(email: string): string | null {
  const at = email.indexOf('@')
  if (at === -1) return null
  return email.slice(at + 1).toLowerCase()
}

async function isPromoEligibleForListing(args: {
  payload: Payload
  promo: PromoDoc
  userEmail?: string | null
  userId?: number
  now: Date
}): Promise<boolean> {
  const { payload, promo, userEmail, userId, now } = args

  if (promo.active === false) return false

  if (promo.validFrom) {
    const start = new Date(promo.validFrom)
    if (now < start) return false
  }

  if (promo.validUntil) {
    const end = new Date(promo.validUntil)
    if (now > end) return false
  }

  const maxTotal = promo.maxRedemptionsTotal
  if (typeof maxTotal === 'number' && maxTotal > 0) {
    const redeemed = promo.timesRedeemed ?? 0
    if (redeemed >= maxTotal) return false
  }

  if (promo.firstTimeCustomersOnly) {
    if (!userId) return false
    const prior = await payload.count({
      collection: 'orders',
      overrideAccess: true,
      where: {
        and: [{ customer: { equals: userId } }, { status: { not_equals: 'cancelled' } }],
      },
    })
    if (prior.totalDocs > 0) return false
  }

  const domains = parseEmailDomains(promo.allowedEmailDomains)
  if (domains.length > 0) {
    if (!userEmail) return false
    const domain = extractEmailDomain(userEmail)
    if (!domain || !domains.includes(domain)) return false
  }

  if (
    userId &&
    typeof promo.maxRedemptionsPerUser === 'number' &&
    promo.maxRedemptionsPerUser > 0
  ) {
    const userOrders = await payload.count({
      collection: 'orders',
      overrideAccess: true,
      where: {
        and: [
          { promoCode: { equals: promo.id } },
          { customer: { equals: userId } },
          { status: { not_equals: 'cancelled' } },
          {
            or: [
              { checkoutBatchId: { exists: false } },
              { 'checkoutShipmentSummary.orderIndex': { equals: 1 } },
            ],
          },
        ],
      },
    })
    if (userOrders.totalDocs >= promo.maxRedemptionsPerUser) return false
  }

  return true
}

export async function listActivePromoCodesForAi(
  payload: Payload,
  args?: { limit?: number; userEmail?: string | null; userId?: number },
): Promise<{ promos: ActivePromoSummary[]; total: number }> {
  const now = new Date()
  const limit = Math.min(Math.max(args?.limit ?? 10, 1), 20)

  const result = await payload.find({
    collection: 'promo-codes',
    depth: 0,
    limit: limit * 3,
    overrideAccess: true,
    sort: '-updatedAt',
    where: {
      and: [
        { active: { equals: true } },
        {
          or: [{ validFrom: { exists: false } }, { validFrom: { less_than_equal: now.toISOString() } }],
        },
        {
          or: [{ validUntil: { exists: false } }, { validUntil: { greater_than_equal: now.toISOString() } }],
        },
      ],
    },
  })

  const promos: ActivePromoSummary[] = []

  for (const doc of result.docs) {
    const promo = doc as PromoDoc
    if (typeof promo.code !== 'string' || !promo.code.trim()) continue

    const eligible = await isPromoEligibleForListing({
      now,
      payload,
      promo,
      userEmail: args?.userEmail,
      userId: args?.userId,
    })
    if (!eligible) continue

    promos.push({
      code: promo.code,
      discountLabel: formatDiscountLabel(promo),
      minOrderSubtotal:
        typeof promo.minOrderSubtotal === 'number' ? promo.minOrderSubtotal : null,
      validUntil: typeof promo.validUntil === 'string' ? promo.validUntil : null,
    })

    if (promos.length >= limit) break
  }

  return { promos, total: promos.length }
}
