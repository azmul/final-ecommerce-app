import type { ReturnRequest } from '@/payload-types'
import type { CollectionAfterChangeHook } from 'payload'

import { processReturnApproval } from '@/lib/returns/processReturnApproval'

export const processReturnApprovalOnDecision: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
  operation,
  context,
}) => {
  if (context?.skipReturnFinancialSync) return doc
  if (operation !== 'update') return doc

  const request = doc as ReturnRequest
  const prev = previousDoc as ReturnRequest | undefined
  if (request.status !== 'approved' || prev?.status === 'approved') return doc

  const orderId =
    typeof request.order === 'object' && request.order ?
      request.order.id
    : request.order
  if (!orderId || !Number.isFinite(Number(orderId))) return doc

  const order = await req.payload.findByID({
    id: Number(orderId),
    collection: 'orders',
    depth: 0,
    overrideAccess: true,
    req,
  })

  if (!order) return doc

  await processReturnApproval({
    order,
    payload: req.payload,
    req,
    returnRequest: request,
  })

  return doc
}
