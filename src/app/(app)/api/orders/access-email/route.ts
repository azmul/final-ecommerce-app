import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { isSameOrigin } from '@/lib/http/assertSameOrigin'
import { getServerSideURL } from '@/utilities/getURL'

type AccessEmailRequestBody = {
  email?: unknown
  orderID?: unknown
}

function jsonResponse(body: { success: boolean; error?: string }, init?: ResponseInit): Response {
  return Response.json(body, init)
}

export async function POST(request: Request): Promise<Response> {
  if (!isSameOrigin(request)) {
    return jsonResponse({ success: false, error: 'Invalid request origin.' }, { status: 403 })
  }

  let body: AccessEmailRequestBody

  try {
    body = (await request.json()) as AccessEmailRequestBody
  } catch {
    return jsonResponse({ success: false, error: 'Invalid request body.' }, { status: 400 })
  }

  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const orderID = typeof body.orderID === 'string' ? body.orderID.trim() : ''

  if (!email || !orderID) {
    return jsonResponse({ success: false, error: 'Email and order ID are required.' }, { status: 400 })
  }

  const payload = await getPayload({ config: configPromise })

  try {
    const { docs: orders } = await payload.find({
      collection: 'orders',
      where: {
        and: [{ id: { equals: orderID } }, { customerEmail: { equals: email } }],
      },
      limit: 1,
      depth: 0,
    })

    const order = orders[0]

    if (!order || !order.accessToken) {
      return jsonResponse({ success: true })
    }

    const serverURL = getServerSideURL()
    const orderURL = `${serverURL}/orders/${order.id}?accessToken=${encodeURIComponent(order.accessToken)}`

    const emailBody = `
      <h1>View Your Order</h1>
      <p>Click the link below to view your order details:</p>
      <p><a href="${orderURL}">View Order #${order.id}</a></p>
      <p>Or copy and paste this URL into your browser:</p>
      <p>${orderURL}</p>
      <p>This link will give you access to view your order details.</p>
    `

    payload.sendEmail({
      to: email,
      subject: `Access your order #${order.id}`,
      html: emailBody,
    }).catch((err) => {
      payload.logger.error({ msg: 'Failed to send order access email', err })
    })

    return jsonResponse({ success: true })
  } catch (err) {
    payload.logger.error({ msg: 'Failed to send order access email', err })
    return jsonResponse({ success: true })
  }
}
