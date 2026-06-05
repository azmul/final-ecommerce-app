import type { CollectionBeforeValidateHook } from 'payload'

export const prepareProductQuestion: CollectionBeforeValidateHook = ({ data, operation, req }) => {
  if (operation !== 'create' || !req.user) return data

  const user = req.user
  const displayName =
    typeof user.name === 'string' && user.name.trim() ?
      user.name.trim()
    : typeof user.email === 'string' ?
      user.email.split('@')[0]
    : 'Customer'

  return {
    ...data,
    askerDisplayName: displayName,
    author: user.id,
    status: 'pending',
  }
}
