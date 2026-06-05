import type { Payload } from 'payload'

import type { ChatContextSidebar } from '@/lib/chat/types'
import type { Cart, ChatConversation, Order, Product, User } from '@/payload-types'

function orderSummary(order: Order) {
  return {
    amount: order.amount,
    createdAt: order.createdAt,
    currency: order.currency,
    id: order.id,
    status: order.status,
  }
}

export async function buildChatContextSidebar(args: {
  payload: Payload
  conversation: ChatConversation
}): Promise<ChatContextSidebar> {
  const customerId =
    typeof args.conversation.customer === 'object' && args.conversation.customer
      ? args.conversation.customer.id
      : args.conversation.customer

  let customer: ChatContextSidebar['customer'] = null

  if (typeof customerId === 'number') {
    const user = (await args.payload.findByID({
      collection: 'users',
      depth: 0,
      id: customerId,
      overrideAccess: true,
    })) as User

    customer = {
      email: user.email,
      id: user.id,
      name: user.name,
      phone: user.phone,
    }
  }

  let cart: ChatContextSidebar['cart'] = null
  const cartId =
    typeof args.conversation.context?.cart === 'object' && args.conversation.context.cart
      ? args.conversation.context.cart.id
      : args.conversation.context?.cart

  if (typeof cartId === 'number') {
    const cartDoc = (await args.payload.findByID({
      collection: 'carts',
      depth: 2,
      id: cartId,
      overrideAccess: true,
    })) as Cart

    const items = (cartDoc.items ?? []).map((item) => {
      const product =
        typeof item.product === 'object' && item.product ? (item.product as Product) : null
      return {
        quantity: item.quantity ?? 0,
        title: product?.title ?? 'Product',
      }
    })

    cart = {
      id: cartDoc.id,
      itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
      items,
      subtotal: cartDoc.subtotal ?? null,
    }
  }

  let order: ChatContextSidebar['order'] = null
  const orderId =
    typeof args.conversation.context?.order === 'object' && args.conversation.context.order
      ? args.conversation.context.order.id
      : args.conversation.context?.order

  if (typeof orderId === 'number') {
    const orderDoc = (await args.payload.findByID({
      collection: 'orders',
      depth: 0,
      id: orderId,
      overrideAccess: true,
    })) as Order
    order = orderSummary(orderDoc)
  }

  let recentOrders: ChatContextSidebar['recentOrders'] = []

  if (typeof customerId === 'number') {
    const orders = await args.payload.find({
      collection: 'orders',
      depth: 0,
      limit: 5,
      overrideAccess: true,
      sort: '-createdAt',
      where: {
        customer: { equals: customerId },
      },
    })

    recentOrders = orders.docs.map((doc) => orderSummary(doc as Order))
  }

  return {
    cart,
    customer,
    order,
    pageUrl: args.conversation.context?.pageUrl,
    productSlug: args.conversation.context?.productSlug,
    recentOrders,
  }
}
