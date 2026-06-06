import type { CollectionBeforeChangeHook } from 'payload'

export const validatePasswordStrength: CollectionBeforeChangeHook = ({ data, operation, originalDoc }) => {
  if (operation === 'create' || (operation === 'update' && data?.password)) {
    const password = data?.password
    if (typeof password === 'string' && password.length > 0) {
      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters.')
      }
      if (!/[A-Z]/.test(password) && !/[a-z]/.test(password)) {
        throw new Error('Password must include at least one letter.')
      }
      if (!/\d/.test(password)) {
        throw new Error('Password must include at least one number.')
      }
    }
  }
  return data
}
