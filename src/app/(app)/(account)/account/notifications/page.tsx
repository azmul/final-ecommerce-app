import type { Metadata } from 'next'

import { NotificationsPageClient } from '@/components/notifications/NotificationsPageClient'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { headers as getHeaders } from 'next/headers.js'
import { redirect } from 'next/navigation'

import { ensureNotificationPreferences } from '@/lib/notifications/ensureNotificationPreferences'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'

export default async function NotificationsPage() {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })

  if (!user) {
    redirect(
      `/login?warning=${encodeURIComponent('Please log in to manage notifications.')}&redirect=${encodeURIComponent('/account/notifications')}`,
    )
  }

  await ensureNotificationPreferences(payload, user.id)

  return <NotificationsPageClient />
}

export const metadata: Metadata = {
  description: 'Notification inbox, preferences, and browser push for your account.',
  openGraph: mergeOpenGraph({
    title: 'Notifications',
    url: '/account/notifications',
  }),
  title: 'Notifications',
}
