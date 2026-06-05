import { normalizeGiftCardCode } from '@/lib/giftCards/normalizeCode'
import type { Payload, PayloadRequest } from 'payload'

export type GiftCardValidationResult =
  | {
      giftCardId: number
      normalizedCode: string
      ok: true
      redeemAmount: number
      remainingAfter: number
    }
  | { message: string; ok: false }

export async function validateGiftCardForCart(args: {
  codeInput: string
  payableSubtotal: number
  payload: Payload
  req?: PayloadRequest
}): Promise<GiftCardValidationResult> {
  const normalizedCode = normalizeGiftCardCode(args.codeInput)
  if (!normalizedCode) {
    return { ok: false, message: 'Enter a gift card code.' }
  }

  const result = await args.payload.find({
    collection: 'gift-cards',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    ...(args.req ? { req: args.req } : {}),
    where: {
      and: [
        { code: { equals: normalizedCode } },
        { active: { equals: true } },
      ],
    },
  })

  const card = result.docs[0]
  if (!card) {
    return { ok: false, message: 'Gift card not found or inactive.' }
  }

  const remaining =
    typeof card.remainingAmount === 'number' ? card.remainingAmount : 0
  if (remaining <= 0) {
    return { ok: false, message: 'This gift card has no remaining balance.' }
  }

  if (card.expiresAt) {
    const expires = new Date(card.expiresAt)
    if (Number.isFinite(expires.getTime()) && expires.getTime() < Date.now()) {
      return { ok: false, message: 'This gift card has expired.' }
    }
  }

  const redeemAmount = Math.min(remaining, Math.max(0, args.payableSubtotal))
  if (redeemAmount <= 0) {
    return { ok: false, message: 'Nothing to apply to this order.' }
  }

  return {
    giftCardId: card.id as number,
    normalizedCode,
    ok: true,
    redeemAmount,
    remainingAfter: remaining - redeemAmount,
  }
}
