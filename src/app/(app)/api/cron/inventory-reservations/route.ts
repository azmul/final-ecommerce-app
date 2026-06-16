import { releaseExpiredReservations } from '@/lib/inventory/reservations'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) return jsonError('CRON_SECRET is not configured.', 503)
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return jsonError('Unauthorized.', 401)
  }

  const payload = await getPayload({ config: configPromise })
  const released = await releaseExpiredReservations(payload)

  return NextResponse.json({ released })
}
