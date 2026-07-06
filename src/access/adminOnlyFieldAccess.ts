import type { FieldAccess } from 'payload'

import { checkRole } from '@/access/utilities'

export const adminOnlyFieldAccess: FieldAccess = ({ req: { user } }) => {
  if (user) return checkRole(['admin'], user)

  return false
}

/** Users must read their own `roles` on `/api/users/me` for admin login redirects to work. */
export const adminOnlyFieldAccessOrSelf: FieldAccess = (args) => {
  const {
    req: { user },
    id,
    doc,
  } = args
  const targetId = id ?? doc?.id

  if (user && targetId != null && String(user.id) === String(targetId)) {
    return true
  }

  return adminOnlyFieldAccess(args)
}
