import { sendOrderChannelMessages } from '@/lib/messaging/orderMessaging'
import type { Order, User } from '@/payload-types'
import type { CollectionAfterChangeHook } from 'payload'

function resolveCustomerUser(order: Order): User | null {
  const customer = order.customer
  if (customer && typeof customer === 'object') return customer as User
  return null
}

export const notifyOrderPlacedSms: CollectionAfterChangeHook = async ({
  doc,
  req,
  operation,
  context,
}) => {
  if (operation !== 'create' || context?.checkoutShipmentFollowerOrder) return doc

  const order = doc as Order
  const siteName = process.env.SITE_NAME || process.env.COMPANY_NAME || 'Store'
  const body = `${siteName}: Order #${order.id} confirmed. We will process it shortly.`

  await sendOrderChannelMessages({
    body,
    order,
    payload: req.payload,
    req,
    user: resolveCustomerUser(order),
  })

  return doc
}

export const notifyOrderDeliveredSms: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
  operation,
}) => {
  if (operation !== 'update') return doc

  const order = doc as Order
  const prev = previousDoc as Order | undefined
  const status = order.status as string | undefined
  const prevStatus = prev?.status as string | undefined
  if (status !== 'delivered' || prevStatus === 'delivered') return doc

  const siteName = process.env.SITE_NAME || process.env.COMPANY_NAME || 'Store'
  const body = `${siteName}: Order #${order.id} has been delivered. Thank you for shopping with us!`

  await sendOrderChannelMessages({
    body,
    order,
    payload: req.payload,
    req,
    user: resolveCustomerUser(order),
  })

  return doc
}
