import { getLoyaltyBalance } from '@/lib/loyalty/getLoyaltyBalance'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: request.headers })

  if (!user) {
    return NextResponse.json({ error: 'Authentication is required.' }, { status: 401 })
  }

  const balance = await getLoyaltyBalance({ payload, userId: user.id })

  const history = await payload.find({
    collection: 'loyalty-transactions',
    depth: 0,
    limit: 20,
    overrideAccess: true,
    sort: '-createdAt',
    where: {
      user: { equals: user.id },
    },
  })

  return NextResponse.json({
    balance,
    transactions: history.docs,
  })
}
