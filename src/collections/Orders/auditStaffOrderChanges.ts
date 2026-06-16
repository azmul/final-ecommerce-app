import { logAdminAudit } from '@/lib/admin/logAdminAudit'
import type { CollectionAfterChangeHook } from 'payload'

export const auditStaffOrderChanges: CollectionAfterChangeHook = async ({
  doc,
  operation,
  previousDoc,
  req,
}) => {
  if (operation !== 'update') return doc

  await logAdminAudit({
    action: 'order_update',
    collection: 'orders',
    documentId: doc.id,
    metadata: {
      previousStatus: (previousDoc as { status?: string } | undefined)?.status,
      status: (doc as { status?: string }).status,
    },
    payload: req.payload,
    req,
    summary: `Updated order #${doc.id}`,
  })

  return doc
}
