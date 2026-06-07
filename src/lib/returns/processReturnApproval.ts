import type { Order, ReturnRequest } from '@/payload-types'
import type { Payload, PayloadRequest } from 'payload'

import {
  incrementInventoryForItems,
  returnItemsToInventoryLines,
} from '@/lib/inventory/incrementInventoryForItems'
import { clawbackLoyaltyForOrder } from '@/lib/loyalty/clawbackLoyaltyForOrder'
import { createStripeRefundForOrder } from '@/lib/payments/stripeRefundForOrder'
import { restoreGiftCardForOrder } from '@/lib/giftCards/restoreGiftCardForOrder'
import { computeReturnRefundAmount } from '@/lib/returns/computeReturnRefundAmount'

function resolveRelationId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'object' && value !== null && 'id' in value) {
    const id = (value as { id: unknown }).id
    if (typeof id === 'number' && Number.isFinite(id)) return id
  }
  return null
}

export type ReturnApprovalResult = {
  financialStatus: 'manual_refund_required' | 'refunded' | 'restocked_only'
  refundAmount?: number
  restocked: boolean
  stripeRefundId?: string
}

export async function processReturnApproval(args: {
  order: Order
  payload: Payload
  req: PayloadRequest
  returnRequest: ReturnRequest
}): Promise<ReturnApprovalResult> {
  const { order, payload, req, returnRequest } = args

  if (returnRequest.financialProcessedAt) {
    return {
      financialStatus:
        (returnRequest.financialStatus as ReturnApprovalResult['financialStatus']) ||
        'restocked_only',
      refundAmount: returnRequest.refundAmount ?? undefined,
      restocked: Boolean(returnRequest.restockedAt),
      stripeRefundId: returnRequest.stripeRefundId ?? undefined,
    }
  }

  const district =
    order.shippingAddress && typeof order.shippingAddress.district === 'string' ?
      order.shippingAddress.district
    : null

  const lines = returnItemsToInventoryLines(returnRequest.items)
  let restocked = false
  if (lines.length) {
    await incrementInventoryForItems({
      district,
      items: lines,
      payload,
      req,
    })
    restocked = true
  }

  const { refundAmount, refundRatio } = await computeReturnRefundAmount({
    order,
    payload,
    req,
    returnRequest,
  })

  let stripeRefundId: string | undefined
  let financialStatus: ReturnApprovalResult['financialStatus'] = 'restocked_only'

  if (refundAmount && returnRequest.requestType === 'return') {
    const stripeResult = await createStripeRefundForOrder({
      amount: refundAmount,
      order,
      payload,
      req,
    })

    if (stripeResult.ok) {
      stripeRefundId = stripeResult.refundId
      financialStatus = 'refunded'
    } else if (stripeResult.reason === 'cod') {
      financialStatus = 'manual_refund_required'
    }
  }

  const customerId = resolveRelationId(order.customer)
  if (customerId != null) {
    await clawbackLoyaltyForOrder({
      order,
      payload,
      refundRatio,
      req,
      userId: customerId,
    })
  }

  await restoreGiftCardForOrder({
    order,
    payload,
    refundRatio,
    req,
  })

  await payload.update({
    id: returnRequest.id,
    collection: 'return-requests',
    data: {
      financialProcessedAt: new Date().toISOString(),
      financialStatus,
      refundAmount: refundAmount ?? null,
      restockedAt: restocked ? new Date().toISOString() : null,
      stripeRefundId: stripeRefundId ?? null,
    },
    overrideAccess: true,
    req,
    context: { skipReturnFinancialSync: true },
  })

  return {
    financialStatus,
    refundAmount,
    restocked,
    stripeRefundId,
  }
}
