import type { CollectionAfterChangeHook } from 'payload'

import { applyUserRiskAssessment, isRiskAssessmentUpdate } from '@/lib/risk/applyRiskAssessment'
import type { User } from '@/payload-types'

export const assessUserRisk: CollectionAfterChangeHook<User> = async ({
  doc,
  operation,
  req,
}) => {
  if (operation !== 'create' || !req?.payload || isRiskAssessmentUpdate(req)) {
    return
  }

  try {
    await applyUserRiskAssessment({
      payload: req.payload,
      user: doc,
      req,
    })
  } catch (error) {
    req.payload.logger.error({
      err: error,
      msg: 'Failed to assess user risk',
      userId: doc.id,
    })
  }
}
