import type { CollectionConfig } from 'payload'

import { adminOnlyFieldAccess } from '@/access/adminOnlyFieldAccess'

export const SECURITY_EVENT_TYPES = [
  'failed_login_email',
  'failed_login_oauth',
  'password_change',
  'role_change',
  'account_created',
  'access_denied',
  'suspicious_activity',
] as const

export type SecurityEventType = (typeof SECURITY_EVENT_TYPES)[number]

export const SecurityEvents: CollectionConfig = {
  slug: 'security-events',
  admin: {
    defaultColumns: ['eventType', 'actor', 'ip', 'summary', 'createdAt'],
    group: 'Admin',
    useAsTitle: 'eventType',
    description:
      'Security-relevant events such as failed logins, access denials, and privilege changes. Read-only via admin panel; entries are created automatically.',
  },
  access: {
    create: () => false, // Only via overrideAccess in logSecurityEvent utility
    delete: () => false,
    read: adminOnlyFieldAccess,
    update: () => false,
  },
  fields: [
    {
      name: 'eventType',
      type: 'select',
      options: SECURITY_EVENT_TYPES.map((type) => ({
        label: type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        value: type,
      })),
      required: true,
      index: true,
    },
    {
      name: 'actor',
      type: 'relationship',
      index: true,
      relationTo: 'users',
      admin: {
        description: 'The user who triggered the event, if authenticated.',
      },
    },
    {
      name: 'ip',
      type: 'text',
      index: true,
      admin: {
        description: 'Client IP address at the time of the event.',
      },
    },
    {
      name: 'userAgent',
      type: 'text',
      admin: {
        description: 'User-Agent header from the request.',
      },
    },
    {
      name: 'summary',
      type: 'textarea',
      admin: {
        description: 'Human-readable description of the event.',
      },
    },
    {
      name: 'metadata',
      type: 'json',
      admin: {
        description:
          'Arbitrary structured data (provider name, page denied, error details, etc.).',
      },
    },
  ],
  timestamps: true,
}
