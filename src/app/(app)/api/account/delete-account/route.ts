import { isSameOrigin } from '@/lib/http/assertSameOrigin'
import configPromise from '@payload-config'
import { createLocalReq, getPayload } from 'payload'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  // CSRF: account deletion is irreversible — reject cross-site requests.
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 })
  }

  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: request.headers })

  if (!user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as {
    confirm?: string
    password?: string
  }
  if (body.confirm !== 'DELETE') {
    return NextResponse.json({ error: 'Send { "confirm": "DELETE" } to delete your account.' }, { status: 400 })
  }

  // Step-up re-authentication for password accounts (blocks deletion via a
  // stolen/borrowed session). OAuth-only accounts have no user-known password,
  // so they fall back to the origin + confirm gate above.
  const isOAuthOnly = Boolean(user.googleId || user.facebookId)
  if (!isOAuthOnly) {
    if (!body.password) {
      return NextResponse.json({ error: 'Password confirmation is required.' }, { status: 400 })
    }
    try {
      const req = await createLocalReq({}, payload)
      const result = await payload.login({
        collection: 'users',
        data: { email: String(user.email), password: body.password },
        req,
      })
      if (!result.user) {
        return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 })
      }
    } catch {
      return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 })
    }
  }

  await payload.delete({
    id: user.id,
    collection: 'users',
    overrideAccess: true,
  })

  return NextResponse.json({ deleted: true })
}
