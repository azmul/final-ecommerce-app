import type { Order } from '@/payload-types'
import type { Payload, PayloadRequest } from 'payload'
import Stripe from 'stripe'

function resolveRelationId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'object' && value !== null && 'id' in value) {
    const id = (value as { id: unknown }).id
    if (typeof id === 'number' && Number.isFinite(id)) return id
  }
  return null
}

export async function createStripeRefundForOrder(args: {
  amount: number
  order: Order
  payload: Payload
  req?: PayloadRequest
}): Promise<
  | { ok: true; refundId: string }
  | { ok: false; reason: 'cod' | 'missing_intent' | 'stripe_error' | 'no_key' }
> {
  const { amount, order, payload, req } = args
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim()
  if (!secretKey) {
    return { ok: false, reason: 'no_key' }
  }

  const transactionRefs = order.transactions
  const txId = Array.isArray(transactionRefs) ? resolveRelationId(transactionRefs[0]) : null
  if (!txId) {
    return { ok: false, reason: 'cod' }
  }

  const transaction = await payload.findByID({
    id: txId,
    collection: 'transactions',
    depth: 0,
    overrideAccess: true,
    ...(req ? { req } : {}),
  })

  if (!transaction || transaction.paymentMethod !== 'stripe') {
    return { ok: false, reason: 'cod' }
  }

  const paymentIntentID = transaction.stripe?.paymentIntentID
  if (!paymentIntentID) {
    return { ok: false, reason: 'missing_intent' }
  }

  try {
    const stripe = new Stripe(secretKey)
    // Order/transaction amounts are already in Stripe minor units (same as cart.subtotal).
    const refund = await stripe.refunds.create({
      amount: Math.round(amount),
      payment_intent: paymentIntentID,
    })

    await payload.update({
      id: txId,
      collection: 'transactions',
      data: { status: 'refunded' },
      overrideAccess: true,
      ...(req ? { req } : {}),
    })

    return { ok: true, refundId: refund.id }
  } catch {
    return { ok: false, reason: 'stripe_error' }
  }
}
