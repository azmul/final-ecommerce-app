import type { ReturnRequest } from '@/payload-types'
import type { CollectionAfterChangeHook } from 'payload'

export const syncOrderStatusOnReturnDecision: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
  operation,
  context,
}) => {
  if (context?.skipReturnOrderSync) return doc
  if (operation !== 'update') return doc

  const request = doc as ReturnRequest
  const prev = previousDoc as ReturnRequest | undefined
  if (request.status !== 'approved' || prev?.status === 'approved') return doc

  const orderId =
    typeof request.order === 'object' && request.order ?
      request.order.id
    : request.order
  if (!orderId || !Number.isFinite(Number(orderId))) return doc

  const nextStatus = request.requestType === 'cancel' ? 'cancelled' : 'refunded'

  await req.payload.update({
    id: Number(orderId),
    collection: 'orders',
    data: {
      status: nextStatus,
    },
    overrideAccess: true,
    req,
  })

  return doc
}
