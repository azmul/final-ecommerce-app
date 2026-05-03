import type { Access } from 'payload'

import { checkRole } from '@/access/utilities'

/**
 * Atomic access checker that verifies if the user owns the document being accessed.
 * Returns a Where query to filter documents by the customer field.
 *
 * Admins have full access, authenticated users get filtered by customer field,
 * and unauthenticated users are denied access.
 *
 * @returns true for admins, Where query for customers, false for guests
 */
export const isDocumentOwner: Access = ({ req }) => {
  // Admin has full access
  if (req.user && checkRole(['admin'], req.user)) {
    return true
  }

  // Authenticated user - return Where query to filter by customer
  if (req.user?.id) {
    return {
      customer: {
        equals: req.user.id,
      },
    }
  }

  // Guest checkout create flow - allow when an email is explicitly provided.
  // This is needed for guest transactions/orders created by payment endpoints.
  const requestData = req.data
  const customerEmail =
    requestData && typeof requestData === 'object' && 'customerEmail' in requestData
      ? requestData.customerEmail
      : undefined

  if (typeof customerEmail === 'string' && customerEmail.trim().length > 0) {
    return true
  }

  // Guest - no access
  return false
}
