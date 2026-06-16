import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: request.headers })

  if (!user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as { confirm?: string }
  if (body.confirm !== 'DELETE') {
    return NextResponse.json({ error: 'Send { "confirm": "DELETE" } to delete your account.' }, { status: 400 })
  }

  await payload.delete({
    id: user.id,
    collection: 'users',
    overrideAccess: true,
  })

  return NextResponse.json({ deleted: true })
}
