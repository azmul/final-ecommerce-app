import type { CollectionConfig } from 'payload'

import { adminOrUserOwnedByUserField } from '@/access/adminOrUserOwnedByUserField'

export const PushSubscriptions: CollectionConfig = {
  slug: 'push-subscriptions',
  admin: {
    group: 'Notifications',
    defaultColumns: ['user', 'platform', 'endpoint', 'updatedAt'],
    useAsTitle: 'endpoint',
  },
  access: {
    create: ({ req }) => Boolean(req.user),
    delete: adminOrUserOwnedByUserField,
    read: adminOrUserOwnedByUserField,
    update: adminOrUserOwnedByUserField,
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
    },
    {
      name: 'platform',
      type: 'select',
      defaultValue: 'web',
      options: [
        { label: 'Web Push', value: 'web' },
        { label: 'Mobile web', value: 'mobile_web' },
        { label: 'Native (FCM/APNs — token stored for future use)', value: 'native' },
      ],
      required: true,
    },
    {
      name: 'endpoint',
      type: 'text',
      index: true,
      required: true,
      admin: {
        description:
          'Web Push subscription URL from the browser, or a placeholder like fcm:TOKEN for native apps (store token only until FCM is configured).',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'p256dh',
          type: 'text',
          label: 'p256dh key',
          validate: (value: unknown, { data }: { data?: { platform?: string } }) => {
            if (data?.platform === 'native') return true
            return value ? true : 'Required for web push'
          },
        },
        {
          name: 'auth',
          type: 'text',
          label: 'Auth secret',
          validate: (value: unknown, { data }: { data?: { platform?: string } }) => {
            if (data?.platform === 'native') return true
            return value ? true : 'Required for web push'
          },
        },
      ],
    },
    {
      name: 'userAgent',
      type: 'text',
      admin: {
        description: 'Optional. Helps debug subscription issues.',
      },
    },
  ],
  hooks: {
    beforeValidate: [
      async ({ data, operation, req }) => {
        if (operation === 'create' && req?.user && data) {
          return { ...data, user: req.user.id }
        }
        return data
      },
    ],
  },
  timestamps: true,
}
