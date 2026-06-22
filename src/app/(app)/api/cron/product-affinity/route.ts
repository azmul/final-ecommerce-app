import { rebuildProductAffinity } from '@/lib/ai/productAffinity'
import { verifyCronAuth } from '@/lib/cron/verifyCronAuth'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export async function GET(request: Request) {
  const cronAuth = verifyCronAuth(request)
  if (!cronAuth.ok) return jsonError(cronAuth.message, cronAuth.status)

  const payload = await getPayload({ config: configPromise })
  const result = await rebuildProductAffinity(payload)

  return NextResponse.json({ ok: true, ...result })
}
