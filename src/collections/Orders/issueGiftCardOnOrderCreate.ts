import { generateGiftCardCode } from '@/lib/giftCards/generateGiftCardCode'
import { resolveOrderCartId } from '@/collections/Orders/resolveOrderCartId'
import type { CollectionAfterChangeHook } from 'payload'

/** Issues a gift card when checkout included a gift card purchase amount. */
export const issueGiftCardOnOrderCreate: CollectionAfterChangeHook = async ({
  doc,
  req,
  operation,
  context,
}) => {
  if (operation !== 'create' || context?.skipGiftCardIssue) {
    return doc
  }

  const cartId = await resolveOrderCartId(doc as Record<string, unknown>, req)
  if (!cartId) return doc

  const cart = await req.payload.findByID({
    id: cartId,
    collection: 'carts',
    depth: 0,
    overrideAccess: true,
    req,
  })

  if (!cart) return doc

  const amount =
    typeof cart.giftCardPurchaseAmount === 'number' ? cart.giftCardPurchaseAmount : null
  if (!amount || amount < 100) return doc

  const customerId = (doc as { customer?: unknown }).customer
  const purchaserId =
    typeof customerId === 'object' && customerId && 'id' in customerId ?
      (customerId as { id: number }).id
    : customerId

  const recipientEmail =
    typeof cart.giftCardRecipientEmail === 'string' ? cart.giftCardRecipientEmail.trim() : null

  let code = generateGiftCardCode()
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const existing = await req.payload.find({
      collection: 'gift-cards',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      where: { code: { equals: code } },
    })
    if (!existing.docs.length) break
    code = generateGiftCardCode()
  }

  const expiresAt = new Date()
  expiresAt.setFullYear(expiresAt.getFullYear() + 1)

  const giftCard = await req.payload.create({
    collection: 'gift-cards',
    data: {
      active: true,
      code,
      expiresAt: expiresAt.toISOString(),
      initialAmount: amount,
      remainingAmount: amount,
      purchaser: typeof purchaserId === 'number' ? purchaserId : undefined,
      recipientEmail: recipientEmail || undefined,
      internalNote: `Issued from order #${doc.id}`,
    },
    overrideAccess: true,
    req,
  })

  await req.payload.update({
    id: cartId,
    collection: 'carts',
    data: {
      giftCardPurchaseAmount: null,
      giftCardRecipientEmail: null,
      issuedGiftCard: giftCard.id,
    },
    overrideAccess: true,
    req,
  })

  await req.payload.update({
    id: doc.id,
    collection: 'orders',
    data: {
      issuedGiftCard: giftCard.id,
      issuedGiftCardCode: code,
    },
    overrideAccess: true,
    req,
    context: {
      ...context,
      skipGiftCardIssue: true,
    },
  })

  return doc
}
