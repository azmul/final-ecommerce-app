import type { CollectionAfterChangeHook } from 'payload'

import { logRoleChanged } from '@/monitoring/auditActions'

/**
 * AfterChange hook that detects role changes and logs them
 * to the admin audit log.
 *
 * Compares the saved document roles with the previous document roles.
 * Runs after all beforeChange hooks (including field-level hooks like
 * ensureFirstUserIsAdmin), so it sees the final saved values.
 */
export const detectRoleChange: CollectionAfterChangeHook = async ({
  operation,
  previousDoc,
  doc,
  req,
}) => {
  if (operation === 'create') return

  const newRoles = (doc?.roles as string[] | undefined) ?? []
  const oldRoles = (previousDoc?.roles as string[] | undefined) ?? []

  const changed =
    newRoles.length !== oldRoles.length ||
    newRoles.some((r) => !oldRoles.includes(r)) ||
    oldRoles.some((r) => !newRoles.includes(r))

  if (changed) {
    await logRoleChanged(req.payload, previousDoc.id as number, oldRoles, newRoles, req)
  }
}
