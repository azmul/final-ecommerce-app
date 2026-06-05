import { sendSms } from '@/lib/messaging/sms'
import { sendWhatsApp } from '@/lib/messaging/whatsapp'
import type { Order, User } from '@/payload-types'
import type { Payload, PayloadRequest } from 'payload'

type MessagingPrefs = {
  smsOrderUpdates?: boolean | null
  whatsappOrderUpdates?: boolean | null
}

async function loadPrefs(args: {
  payload: Payload
  req?: PayloadRequest
  userId: number
}): Promise<MessagingPrefs | null> {
  const result = await args.payload.find({
    collection: 'notification-preferences',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    ...(args.req ? { req: args.req } : {}),
    where: { user: { equals: args.userId } },
  })

  return (result.docs[0] as MessagingPrefs | undefined) ?? null
}

function resolvePhone(order: Order, user?: User | null): string | null {
  const orderPhone = order.customerPhone?.trim()
  if (orderPhone) return orderPhone
  const userPhone = user?.phone?.trim()
  return userPhone || null
}

export async function sendOrderChannelMessages(args: {
  body: string
  order: Order
  payload: Payload
  req?: PayloadRequest
  user?: User | null
}): Promise<void> {
  const userId =
    typeof args.user?.id === 'number' ? args.user.id
    : typeof args.order.customer === 'number' ? args.order.customer
    : args.order.customer && typeof args.order.customer === 'object' ?
      args.order.customer.id
    : null

  const phone = resolvePhone(args.order, args.user ?? null)
  if (!phone) return

  const prefs = userId != null ? await loadPrefs({ payload: args.payload, req: args.req, userId }) : null
  const smsEnabled = prefs?.smsOrderUpdates !== false
  const whatsappEnabled = prefs?.whatsappOrderUpdates === true

  if (smsEnabled) {
    const result = await sendSms({ body: args.body, to: phone })
    if (!result.ok) {
      args.payload.logger.warn({ msg: 'Order SMS failed', error: result.error, orderId: args.order.id })
    }
  }

  if (whatsappEnabled) {
    const result = await sendWhatsApp({ body: args.body, to: phone })
    if (!result.ok) {
      args.payload.logger.warn({
        msg: 'Order WhatsApp failed',
        error: result.error,
        orderId: args.order.id,
      })
    }
  }
}
