import type { Access, FieldAccess } from 'payload'

import { checkRole } from '@/access/utilities'

export const adminOnly: Access = ({ req: { user } }) => {
  if (user) return checkRole(['admin'], user)

  return false
}

export const adminOnlyField: FieldAccess = ({ req: { user } }) => {
  if (user) return checkRole(['admin'], user)

  return false
}
