import type { Cart } from '@/payload-types'
import type { Endpoint, PayloadHandler, Plugin } from 'payload'
import { addDataAndFileToRequest } from 'payload'

import { verifyCartAccess } from '@/lib/carts/verifyCartAccess'
import { ALREADY_CHECKED_OUT_MESSAGE } from '@/lib/payments/checkoutErrors'

function isConfirmOrderEndpoint(path: unknown): boolean {
  return typeof path === 'string' && path.endsWith('/confirm-order')
}

function resolveConfirmCartId(data: Record<string, unknown> | undefined): number | null {
  const raw = data?.cartID ?? data?.cart
  if (raw != null && typeof raw === 'object' && 'id' in raw) {
    const id = (raw as { id: unknown }).id
    if (typeof id === 'number' && Number.isFinite(id)) return id
  }
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  if (typeof raw === 'string' && /^\d+$/.test(raw)) return Number(raw)
  return null
}

async function alreadyCheckedOutResponse(req: Parameters<PayloadHandler>[0]): Promise<Response | null> {
  const cartID = resolveConfirmCartId(req.data as Record<string, unknown> | undefined)
  if (cartID == null) return null

  const cart = await req.payload.findByID({
    id: cartID,
    collection: 'carts',
    depth: 0,
    overrideAccess: true,
  })

  if (!cart?.purchasedAt) return null

  const data = req.data as Record<string, unknown> | undefined
  const access = verifyCartAccess({
    cart: cart as Cart,
    secret: typeof data?.secret === 'string' ? data.secret : undefined,
    userId: req.user?.id,
  })

  let orderID: number | undefined
  let accessToken: string | undefined

  if (access.ok) {
    const orders = await req.payload.find({
      collection: 'orders',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      sort: '-createdAt',
      where: {
        checkoutCart: {
          equals: cartID,
        },
      },
    })

    const order = orders.docs[0]
    if (order && typeof order.id === 'number') {
      orderID = order.id
      if (typeof order.accessToken === 'string' && order.accessToken) {
        accessToken = order.accessToken
      }
    }
  }

  return Response.json(
    {
      accessToken,
      message: ALREADY_CHECKED_OUT_MESSAGE,
      orderID,
    },
    { status: 409 },
  )
}

function restoreRequestJsonBody(
  req: Parameters<PayloadHandler>[0],
  data: Record<string, unknown> | undefined,
): void {
  if (!data || typeof data !== 'object') {
    return
  }

  const serialized = JSON.stringify(data)
  req.data = data
  req.json = async () => data
  req.text = async () => serialized
}

function wrapConfirmOrderHandler(handler: PayloadHandler): PayloadHandler {
  return async (req) => {
    await addDataAndFileToRequest(req)
    const requestData = req.data as Record<string, unknown> | undefined

    const blocked = await alreadyCheckedOutResponse(req)
    if (blocked) return blocked

    restoreRequestJsonBody(req, requestData)
    return handler(req)
  }
}

/**
 * Payload ecommerce confirm-order handlers replace adapter errors with a generic 500.
 * Pre-check purchased carts so clients receive the actionable checkout message.
 */
export function surfacePaymentConfirmErrorsPlugin(): Plugin {
  return (incomingConfig) => {
    const endpoints = incomingConfig.endpoints ?? []

    return {
      ...incomingConfig,
      endpoints: endpoints.map((endpoint: Endpoint) => {
        if (!isConfirmOrderEndpoint(endpoint.path)) {
          return endpoint
        }

        return {
          ...endpoint,
          handler: wrapConfirmOrderHandler(endpoint.handler),
        }
      }),
    }
  }
}
