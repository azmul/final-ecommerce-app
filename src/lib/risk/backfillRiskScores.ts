import type { Payload } from 'payload'

import { applyOrderRiskAssessment } from '@/lib/risk/applyRiskAssessment'
import { applyUserRiskAssessment } from '@/lib/risk/applyRiskAssessment'

export type BackfillRiskScoresResult = {
  ordersProcessed: number
  ordersUpdated: number
  usersProcessed: number
  usersUpdated: number
}

export async function backfillRiskScores(args: {
  payload: Payload
  days?: number
  dryRun?: boolean
}): Promise<BackfillRiskScoresResult> {
  const days = args.days ?? 30
  const sinceIso = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
  const result: BackfillRiskScoresResult = {
    ordersProcessed: 0,
    ordersUpdated: 0,
    usersProcessed: 0,
    usersUpdated: 0,
  }

  let orderPage = 1
  let hasMoreOrders = true
  while (hasMoreOrders) {
    const orders = await args.payload.find({
      collection: 'orders',
      depth: 0,
      limit: 50,
      overrideAccess: true,
      page: orderPage,
      sort: '-createdAt',
      where: {
        createdAt: { greater_than_equal: sinceIso },
      },
    })

    for (const order of orders.docs) {
      result.ordersProcessed += 1
      if (!args.dryRun) {
        await applyOrderRiskAssessment({
          payload: args.payload,
          order,
        })
      }
      result.ordersUpdated += 1
    }

    hasMoreOrders = orders.hasNextPage
    orderPage += 1
  }

  let userPage = 1
  let hasMoreUsers = true
  while (hasMoreUsers) {
    const users = await args.payload.find({
      collection: 'users',
      depth: 0,
      limit: 50,
      overrideAccess: true,
      page: userPage,
      sort: '-createdAt',
      where: {
        createdAt: { greater_than_equal: sinceIso },
      },
    })

    for (const user of users.docs) {
      result.usersProcessed += 1
      if (!args.dryRun) {
        await applyUserRiskAssessment({
          payload: args.payload,
          user,
        })
      }
      result.usersUpdated += 1
    }

    hasMoreUsers = users.hasNextPage
    userPage += 1
  }

  return result
}
