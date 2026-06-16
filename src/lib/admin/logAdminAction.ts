import type { Payload, PayloadRequest } from 'payload'

type LogArgs = {
  action: 'create' | 'update' | 'delete' | 'import' | 'shipment'
  actorId?: number | null
  collection: string
  documentId?: string | number | null
  metadata?: Record<string, unknown> | null
  payload: Payload
  req?: PayloadRequest
  summary: string
}

export async function logAdminAction(args: LogArgs): Promise<void> {
  if (!args.actorId) return

  await args.payload.create({
    collection: 'admin-audit-logs',
    data: {
      action: args.action,
      actor: args.actorId,
      collection: args.collection,
      documentId: args.documentId != null ? String(args.documentId) : undefined,
      metadata: args.metadata ?? undefined,
      summary: args.summary,
    },
    overrideAccess: true,
    ...(args.req ? { req: args.req } : {}),
  })
}
