import { resolveLoginEmailFromContact } from '@/lib/auth/resolveLoginEmailFromContact'
import type { CollectionBeforeOperationHook } from 'payload'

export const resolveLoginContact: CollectionBeforeOperationHook = async ({
  args,
  operation,
  req,
}) => {
  if (operation !== 'login') {
    return args
  }

  const contact = typeof args.data?.email === 'string' ? args.data.email : ''
  if (!contact.trim()) {
    return args
  }

  const email = await resolveLoginEmailFromContact(req.payload, contact)

  return {
    ...args,
    data: {
      ...args.data,
      email,
    },
  }
}
