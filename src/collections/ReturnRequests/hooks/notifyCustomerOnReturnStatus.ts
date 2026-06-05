import { renderOrderEmailHtml, resolveOrderRecipientEmail } from '@/lib/email/renderOrderEmail'
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

function statusMessage(request: ReturnRequest): { body: string; title: string } {
  const typeLabel = request.requestType === 'cancel' ? 'Cancellation' : 'Return / refund'

  if (request.status === 'approved') {
    return {
      title: `${typeLabel} request approved`,
      body:
        request.requestType === 'cancel' ?
          'Your cancellation request was approved. The order has been cancelled.'
        : 'Your return request was approved. We will process your refund shortly.',
    }
  }

  if (request.status === 'rejected') {
    const note =
      typeof request.resolutionNote === 'string' && request.resolutionNote.trim() ?
        ` ${request.resolutionNote.trim()}`
      : ''
    return {
      title: `${typeLabel} request declined`,
      body: `Your request could not be approved.${note}`,
    }
  }

  return {
    title: `${typeLabel} request update`,
    body: `Your request status is now ${request.status}.`,
  }
}

export const notifyCustomerOnReturnStatus: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
  operation,
}) => {
  if (operation !== 'update') return doc

  const request = doc as ReturnRequest
  const prev = previousDoc as ReturnRequest | undefined
  if (request.status === prev?.status) return doc
  if (request.status !== 'approved' && request.status !== 'rejected') return doc

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

  const { body, title } = statusMessage(request)
  const siteName = process.env.SITE_NAME || process.env.COMPANY_NAME || 'Store'
  const linkUrl = `/orders/${order.id}`
  const accessToken = typeof order.accessToken === 'string' ? order.accessToken : null
  const orderLink = accessToken ? `${linkUrl}?accessToken=${encodeURIComponent(accessToken)}` : linkUrl

  const to = resolveOrderRecipientEmail(order)
  if (to) {
    try {
      await req.payload.sendEmail({
        to,
        subject: `${title} — Order #${order.id} — ${siteName}`,
        html: renderOrderEmailHtml(order, {
          accessToken,
          heading: title,
          intro: body,
        }),
      })
    } catch (err) {
      req.payload.logger.error({
        msg: 'Return request status email failed',
        err,
        orderId: order.id,
        requestId: request.id,
      })
    }
  }

  const userId = resolveCustomerUserId(request)
  if (userId != null) {
    try {
      await deliverToUser({
        body,
        kind: 'system',
        linkUrl: orderLink,
        payload: req.payload,
        req,
        title,
        userId,
      })
    } catch (err) {
      req.payload.logger.error({
        msg: 'Return request status notification failed',
        err,
        orderId: order.id,
        requestId: request.id,
      })
    }
  }

  return doc
}
