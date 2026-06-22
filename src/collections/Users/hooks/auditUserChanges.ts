import type { CollectionAfterChangeHook } from 'payload'

import { logUserCreated } from '@/monitoring/auditActions'

/**
 * AfterChange hook that logs user account creation to the admin audit log.
 *
 * Only fires when operation is 'create' — update operations are ignored.
 * The user creation event is written to the `admin-audit-logs` collection.
 */
export const auditUserCreated: CollectionAfterChangeHook = async ({
  operation,
  req,
  doc,
}) => {
  if (operation !== 'create') return

  const payload = req.payload
  const user = doc as { email?: string | null; id: number; name?: string | null }

  await logUserCreated(payload, user, req)
}
