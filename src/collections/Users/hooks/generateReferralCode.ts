import { generateReferralCode } from '@/lib/referrals/config'
import type { CollectionBeforeChangeHook } from 'payload'

export const assignReferralCode: CollectionBeforeChangeHook = async ({
  data,
  operation,
  req,
}) => {
  if (operation !== 'create') return data
  if (data?.referralCode) return data

  const provisional = generateReferralCode(Date.now())
  data.referralCode = provisional

  const existing = await req.payload.find({
    collection: 'users',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: { referralCode: { equals: provisional } },
  })

  if (existing.docs.length > 0) {
    data.referralCode = generateReferralCode(Math.floor(Math.random() * 1_000_000))
  }

  return data
}
