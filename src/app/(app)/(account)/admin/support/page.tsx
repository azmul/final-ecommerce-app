import type { Metadata } from 'next'

import { SupportInbox } from '@/components/chat/SupportInbox'
import { noindexMetadata } from '@/lib/seo/noindexMetadata'
import { requireStaffPermissionApi } from '@/lib/permissions/requireStaffPermissionApi'
import { redirect } from 'next/navigation'
import { headers as getHeaders } from 'next/headers'

export const metadata: Metadata = noindexMetadata({
  title: 'Support Inbox',
})

export const dynamic = 'force-dynamic'

export default async function SupportInboxPage() {
  const requestHeaders = await getHeaders()
  const auth = await requireStaffPermissionApi('chat', 'view', requestHeaders)

  if (!auth.ok) {
    redirect(auth.status === 401 ? '/login' : '/account')
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Support inbox</h1>
        <p className="text-sm text-muted-foreground">
          Manage live chat conversations with order and cart context.
        </p>
      </div>
      <SupportInbox />
    </div>
  )
}
