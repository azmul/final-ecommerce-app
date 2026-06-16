import type { Payload, PayloadRequest } from 'payload'

import { checkRole } from '@/access/utilities'

export async function logAdminAudit(args: {
  action: string
  actorId?: number | null
  collection: string
  documentId?: string | number | null
  metadata?: Record<string, unknown> | null
  payload: Payload
  req?: PayloadRequest
  summary?: string | null
}): Promise<void> {
  const { payload, req } = args
  const user = req?.user

  if (!user || !checkRole(['admin', 'officeStaff'], user)) {
    return
  }

  try {
    await payload.create({
      collection: 'admin-audit-logs',
      data: {
        action: args.action,
        actor: args.actorId ?? user.id,
        collection: args.collection,
        documentId: args.documentId != null ? String(args.documentId) : undefined,
        metadata: args.metadata ?? undefined,
        summary: args.summary ?? undefined,
      },
      overrideAccess: true,
      ...(req ? { req } : {}),
    })
  } catch (err) {
    console.warn('[audit-log]', err)
  }
}
