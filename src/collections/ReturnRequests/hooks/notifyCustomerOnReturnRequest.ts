import { deliverToUser } from '@/lib/notifications/deliverToUser'
import type { Order, ReturnRequest } from '@/payload-types'
import type { CollectionAfterChangeHook } from 'payload'

function resolveCustomerUserId(request: ReturnRequest): number | null {
  const customer = request.customer
  if (typeof customer === 'number' && Number.isFinite(customer)) return customer
  if (customer && typeof customer === 'object' && 'id' in customer) {
    const id = (customer as { id: unknown }).id
    if (typeof id === 'number' && Number.isFinite(id)) return id
  }
  return null
}

export const notifyCustomerOnReturnRequest: CollectionAfterChangeHook = async ({
  doc,
  operation,
  req,
}) => {
  if (operation !== 'create') return doc

  const request = doc as ReturnRequest
  const userId = resolveCustomerUserId(request)
  if (userId == null) return doc

  const orderId =
    typeof request.order === 'object' && request.order ?
      request.order.id
    : request.order
  if (!orderId || !Number.isFinite(Number(orderId))) return doc

  const order = (await req.payload.findByID({
    id: Number(orderId),
    collection: 'orders',
    depth: 0,
    overrideAccess: true,
    req,
  })) as Order | null

  if (!order) return doc

  const typeLabel = request.requestType === 'cancel' ? 'Cancellation' : 'Return / refund'
  const title = `${typeLabel} request submitted`
  const body =
    request.requestType === 'cancel' ?
      `We received your cancellation request for order #${order.id}. We will review it shortly.`
    : `We received your return request for order #${order.id}. We will review it shortly.`

  const accessToken = typeof order.accessToken === 'string' ? order.accessToken : null
  const linkUrl =
    accessToken ?
      `/orders/${order.id}?accessToken=${encodeURIComponent(accessToken)}`
    : `/orders/${order.id}`

  try {
    await deliverToUser({
      body,
      kind: 'system',
      linkUrl,
      payload: req.payload,
      req,
      title,
      userId,
    })
  } catch (err) {
    req.payload.logger.error({
      msg: 'Return request submission notification failed',
      err,
      orderId: order.id,
      requestId: request.id,
    })
  }

  return doc
}
