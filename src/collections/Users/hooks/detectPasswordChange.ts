import type { CollectionBeforeChangeHook } from 'payload'

import { logPasswordChanged } from '@/monitoring/auditActions'

/**
 * BeforeChange hook that detects password changes and logs them
 * to the admin audit log.
 *
 * If a non-empty password string is provided in an update operation,
 * the user is changing their password. (The password field is hashed
 * by Payload after beforeChange hooks run.)
 */
export const detectPasswordChange: CollectionBeforeChangeHook = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  if (operation === 'create') return data

  const hasPasswordChange =
    typeof data?.password === 'string' && data.password.length > 0

  if (hasPasswordChange) {
    await logPasswordChanged(req.payload, originalDoc.id as number, req)
  }

  return data
}
