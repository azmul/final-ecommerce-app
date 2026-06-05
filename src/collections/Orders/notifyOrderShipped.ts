import { renderOrderEmailHtml, resolveOrderRecipientEmail } from '@/lib/email/renderOrderEmail'
import { sendOrderChannelMessages } from '@/lib/messaging/orderMessaging'
import { deliverToUser } from '@/lib/notifications/deliverToUser'
import type { Order } from '@/payload-types'
import type { CollectionAfterChangeHook } from 'payload'

function resolveCustomerUserId(order: Order): number | null {
  const customer = order.customer
  if (typeof customer === 'number' && Number.isFinite(customer)) return customer
  if (customer && typeof customer === 'object' && 'id' in customer) {
    const id = (customer as { id: unknown }).id
    if (typeof id === 'number' && Number.isFinite(id)) return id
  }
  return null
}

/**
 * Notifies customer when order status changes to shipped (email + inbox/push).
 */
export const notifyOrderShipped: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
  operation,
  context,
}) => {
  if (context?.skipOrderShippedNotification) {
    return doc
  }

  if (operation !== 'update') {
    return doc
  }

  const order = doc as Order
  const prev = previousDoc as Order | undefined
  const status = order.status as string | undefined
  const prevStatus = prev?.status as string | undefined
  if (status !== 'shipped' || prevStatus === 'shipped') {
    return doc
  }

  const siteName = process.env.SITE_NAME || process.env.COMPANY_NAME || 'Store'
  const fulfillment = (order as Order & { fulfillment?: { trackingNumber?: string | null } })
    .fulfillment
  const trackingNumber =
    fulfillment && typeof fulfillment === 'object' ? fulfillment.trackingNumber : null
  const trackingLine =
    trackingNumber?.trim() ? ` Tracking: ${trackingNumber.trim()}.` : ''

  const to = resolveOrderRecipientEmail(order)
  if (to) {
    try {
      await req.payload.sendEmail({
        to,
        subject: `Order #${order.id} has shipped — ${siteName}`,
        html: renderOrderEmailHtml(order, {
          accessToken: typeof order.accessToken === 'string' ? order.accessToken : null,
          heading: 'Your order is on the way',
          intro: `Good news — your order has shipped.${trackingLine}`,
        }),
      })
    } catch (err) {
      req.payload.logger.error({ msg: 'Order shipped email failed', err, orderId: order.id })
    }
  }

  await sendOrderChannelMessages({
    body: `Order #${order.id} has shipped.${trackingLine}`,
    order,
    payload: req.payload,
    req,
    user:
      order.customer && typeof order.customer === 'object' ?
        (order.customer as Parameters<typeof sendOrderChannelMessages>[0]['user'])
      : null,
  })

  const userId = resolveCustomerUserId(order)
  if (userId != null) {
    try {
      await deliverToUser({
        body: `Order #${order.id} has shipped.${trackingLine}`,
        kind: 'system',
        linkUrl: `/orders/${order.id}`,
        payload: req.payload,
        req,
        title: 'Order shipped',
        userId,
      })
    } catch (err) {
      req.payload.logger.error({ msg: 'Order shipped notification failed', err, orderId: order.id })
    }
  }

  return doc
}
