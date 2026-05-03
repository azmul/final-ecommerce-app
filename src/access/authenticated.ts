import type { Access } from 'payload'

/** Authenticated Payload user (customers and admins). */
export const authenticated: Access = ({ req }) => Boolean(req?.user)
