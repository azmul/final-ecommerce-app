import type { Payload } from 'payload'

import { captureRequestContext } from '@/lib/risk/captureRequestContext'
import { defaultReviewStatus } from '@/lib/risk/scoreLevel'
import { scoreOrderRisk } from '@/lib/risk/scoreOrderRisk'
import { scoreUserRisk } from '@/lib/risk/scoreUserRisk'
import type { Order, User } from '@/payload-types'

const RISK_ASSESSED_CONTEXT_KEY = 'riskAssessed'

export function isRiskAssessmentUpdate(req: { context?: Record<string, unknown> }): boolean {
  return Boolean(req.context?.[RISK_ASSESSED_CONTEXT_KEY])
}

export function markRiskAssessmentContext(req: { context?: Record<string, unknown> }): void {
  if (!req.context) {
    req.context = {}
  }
  req.context[RISK_ASSESSED_CONTEXT_KEY] = true
}

export async function applyOrderRiskAssessment(args: {
  payload: Payload
  order: Order
  req?: Parameters<Payload['update']>[0]['req']
}): Promise<Order> {
  const requestContext = captureRequestContext(args.req)
  const result = await scoreOrderRisk({
    payload: args.payload,
    order: args.order,
    requestContext,
  })

  if (args.req) {
    markRiskAssessmentContext(args.req)
  }

  return (await args.payload.update({
    collection: 'orders',
    id: args.order.id,
    data: {
      riskAssessment: {
        riskScore: result.score,
        riskLevel: result.level,
        riskFlags: result.flags,
        riskReviewStatus: defaultReviewStatus(result.level),
        riskCapturedIp: requestContext.ip,
        riskCapturedUserAgent: requestContext.userAgent,
      },
    },
    overrideAccess: true,
    req: args.req,
  })) as Order
}

export async function applyUserRiskAssessment(args: {
  payload: Payload
  user: User
  req?: Parameters<Payload['update']>[0]['req']
}): Promise<User> {
  const requestContext = captureRequestContext(args.req)
  const result = await scoreUserRisk({
    payload: args.payload,
    user: args.user,
    requestContext,
  })

  if (args.req) {
    markRiskAssessmentContext(args.req)
  }

  return (await args.payload.update({
    collection: 'users',
    id: args.user.id,
    data: {
      riskAssessment: {
        riskScore: result.score,
        riskLevel: result.level,
        riskFlags: result.flags,
        riskReviewStatus: defaultReviewStatus(result.level),
        riskCapturedIp: requestContext.ip,
        riskCapturedUserAgent: requestContext.userAgent,
      },
    },
    overrideAccess: true,
    req: args.req,
  })) as User
}
