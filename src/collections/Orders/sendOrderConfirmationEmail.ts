import { renderOrderEmailHtml, resolveOrderRecipientEmail } from '@/lib/email/renderOrderEmail'
import type { Order } from '@/payload-types'
import type { CollectionAfterChangeHook } from 'payload'

/**
 * Sends order confirmation email on create (primary order in a batch only).
 */
export const sendOrderConfirmationEmail: CollectionAfterChangeHook = async ({
  doc,
  req,
  operation,
  context,
}) => {
  if (operation !== 'create' || context?.checkoutShipmentFollowerOrder) {
    return doc
  }

  if (context?.skipOrderConfirmationEmail) {
    return doc
  }

  const order = doc as Order
  const to = resolveOrderRecipientEmail(order)
  if (!to) {
    return doc
  }

  const siteName = process.env.SITE_NAME || process.env.COMPANY_NAME || 'Store'

  try {
    await req.payload.sendEmail({
      to,
      subject: `Order #${order.id} confirmed — ${siteName}`,
      html: renderOrderEmailHtml(order, {
        accessToken: typeof order.accessToken === 'string' ? order.accessToken : null,
        heading: 'Thank you for your order',
        intro: `We received your order and will process it shortly.`,
      }),
    })
  } catch (err) {
    req.payload.logger.error({ msg: 'Order confirmation email failed', err, orderId: order.id })
  }

  return doc
}
