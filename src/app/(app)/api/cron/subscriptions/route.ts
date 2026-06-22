import { deliverToUser } from '@/lib/notifications/deliverToUser'
import { verifyCronAuth } from '@/lib/cron/verifyCronAuth'
import { escapeHtml } from '@/utilities/escapeHtml'
import { getServerSideURL } from '@/utilities/getURL'
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
  const now = new Date().toISOString()
  const siteName = process.env.SITE_NAME || process.env.COMPANY_NAME || 'Store'
  const shopUrl = `${getServerSideURL()}/shop`

  const due = await payload.find({
    collection: 'subscriptions',
    depth: 1,
    limit: 25,
    overrideAccess: true,
    where: {
      and: [
        { active: { equals: true } },
        { nextOrderAt: { less_than_equal: now } },
      ],
    },
  })

  const results: { id: number; notified: boolean }[] = []

  for (const sub of due.docs) {
    const userId =
      typeof sub.user === 'object' && sub.user ? sub.user.id : sub.user
    const email =
      typeof sub.user === 'object' && sub.user && typeof sub.user.email === 'string' ?
        sub.user.email
      : null

    const intervalDays = typeof sub.intervalDays === 'number' ? sub.intervalDays : 30
    const next = new Date()
    next.setDate(next.getDate() + intervalDays)

    if (email) {
      try {
        await payload.sendEmail({
          to: email,
          subject: `Time to reorder — ${siteName}`,
          html: `
            <p>Your subscription is due for a repeat order.</p>
            <p><a href="${escapeHtml(shopUrl)}">Shop now</a> or manage subscriptions in your account.</p>
          `,
        })
      } catch (err) {
        payload.logger.error({ msg: 'Subscription reminder email failed', err, subId: sub.id })
      }
    }

    if (typeof userId === 'number') {
      try {
        await deliverToUser({
          body: 'Your subscription repeat order is due. Tap to shop again.',
          kind: 'system',
          linkUrl: '/account',
          payload,
          title: 'Subscription reminder',
          userId,
        })
      } catch {
        /* non-fatal */
      }
    }

    await payload.update({
      id: sub.id,
      collection: 'subscriptions',
      data: {
        lastReminderAt: now,
        nextOrderAt: next.toISOString(),
      },
      overrideAccess: true,
    })

    results.push({ id: sub.id as number, notified: true })
  }

  return NextResponse.json({ processed: results.length, results })
}
