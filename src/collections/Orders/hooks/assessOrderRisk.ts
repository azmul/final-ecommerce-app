import type { CollectionAfterChangeHook } from 'payload'

import { applyOrderRiskAssessment, isRiskAssessmentUpdate } from '@/lib/risk/applyRiskAssessment'
import type { Order } from '@/payload-types'

export const assessOrderRisk: CollectionAfterChangeHook<Order> = async ({
  doc,
  operation,
  req,
}) => {
  if (operation !== 'create' || !req?.payload || isRiskAssessmentUpdate(req)) {
    return
  }

  try {
    await applyOrderRiskAssessment({
      payload: req.payload,
      order: doc,
      req,
    })
  } catch (error) {
    req.payload.logger.error({
      err: error,
      msg: 'Failed to assess order risk',
      orderId: doc.id,
    })
  }
}
