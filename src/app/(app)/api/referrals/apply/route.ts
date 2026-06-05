import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: request.headers })

  if (!user) {
    return NextResponse.json({ error: 'Authentication is required.' }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as { code?: unknown }
  const code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : ''
  if (!code) {
    return NextResponse.json({ error: 'Referral code is required.' }, { status: 400 })
  }

  const fresh = await payload.findByID({
    id: user.id,
    collection: 'users',
    depth: 0,
    overrideAccess: true,
  })

  if (fresh?.referredBy) {
    return NextResponse.json({ error: 'Referral already applied to this account.' }, { status: 409 })
  }

  if (fresh?.referralCode === code) {
    return NextResponse.json({ error: 'You cannot use your own referral code.' }, { status: 400 })
  }

  const referrer = await payload.find({
    collection: 'users',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: { referralCode: { equals: code } },
  })

  const referrerDoc = referrer.docs[0]
  if (!referrerDoc) {
    return NextResponse.json({ error: 'Referral code not found.' }, { status: 404 })
  }

  await payload.update({
    id: user.id,
    collection: 'users',
    data: { referredBy: referrerDoc.id },
    overrideAccess: true,
  })

  return NextResponse.json({ ok: true })
}
