import configPromise from '@payload-config'
import { getPayload, type Where } from 'payload'
import { NextResponse } from 'next/server'

import { deliverToUser } from '@/lib/notifications/deliverToUser'
import { verifyCronAuth } from '@/lib/cron/verifyCronAuth'

export const dynamic = 'force-dynamic'

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export async function GET(request: Request) {
  const cronAuth = verifyCronAuth(request)
  if (!cronAuth.ok) return jsonError(cronAuth.message, cronAuth.status)

  const payload = await getPayload({ config: configPromise })
  const now = new Date().toISOString()

  const due = await payload.find({
    collection: 'notification-broadcasts',
    depth: 0,
    limit: 5,
    overrideAccess: true,
    pagination: false,
    sort: 'scheduledFor',
    where: {
      status: { equals: 'scheduled' },
      scheduledFor: { less_than_equal: now },
    },
  })

  const results: { id: number; recipients?: number; error?: string }[] = []

  for (const campaign of due.docs) {
    const c = campaign as {
      id: number
      title: string
      body: string
      linkUrl?: string | null
      segment?: 'push_enabled' | 'marketing_opt_in'
    }

    await payload.update({
      id: c.id,
      collection: 'notification-broadcasts',
      data: { lastError: '', status: 'sending' },
      overrideAccess: true,
    })

    try {
      const prefsWhere: Where =
        c.segment === 'marketing_opt_in'
          ? {
              marketingOptIn: { equals: true },
              pushEnabled: { equals: true },
            }
          : { pushEnabled: { equals: true } }

      const audience = await payload.find({
        collection: 'notification-preferences',
        depth: 0,
        limit: 2000,
        overrideAccess: true,
        pagination: false,
        where: prefsWhere,
      })

      let recipients = 0
      for (const row of audience.docs) {
        const uid =
          typeof row.user === 'object' && row.user && 'id' in row.user
            ? Number((row.user as { id: number }).id)
            : Number(row.user)

        if (!Number.isFinite(uid)) {
          continue
        }

        try {
          const out = await deliverToUser({
            body: c.body,
            broadcastId: c.id,
            broadcastSegment: c.segment === 'marketing_opt_in' ? 'marketing_opt_in' : 'push_enabled',
            kind: 'broadcast',
            linkUrl: c.linkUrl ?? undefined,
            payload,
            title: c.title,
            userId: uid,
          })
          if (out.delivered) {
            recipients++
          }
        } catch {
          //
        }
      }

      await payload.update({
        id: c.id,
        collection: 'notification-broadcasts',
        data: { statsRecipients: recipients, status: 'completed' },
        overrideAccess: true,
      })

      results.push({ id: c.id, recipients })
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      await payload.update({
        id: c.id,
        collection: 'notification-broadcasts',
        data: { lastError: message, status: 'draft' },
        overrideAccess: true,
      })
      results.push({ error: message, id: c.id })
    }
  }

  return NextResponse.json({ ok: true, processed: results })
}
