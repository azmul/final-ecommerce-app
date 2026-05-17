import type { CollectionConfig } from 'payload'

import { staffOrUserOwnedByUserField } from '@/access/adminOrUserOwnedByUserField'
import { adminOrStaff, staffCanViewAdminPage } from '@/access/staffAccess'

export const UserNotifications: CollectionConfig = {
  slug: 'user-notifications',
  admin: {
    group: 'Notifications',
    defaultColumns: ['user', 'kind', 'title', 'readAt', 'createdAt'],
    useAsTitle: 'title',
  },
  access: {
    admin: staffCanViewAdminPage('user-notifications'),
    create: adminOrStaff('user-notifications', 'create'),
    delete: adminOrStaff('user-notifications', 'delete'),
    read: staffOrUserOwnedByUserField('user-notifications', 'view'),
    update: staffOrUserOwnedByUserField('user-notifications', 'edit'),
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
      name: 'kind',
      type: 'select',
      required: true,
      index: true,
      options: [
        { label: 'Price drop', value: 'price_drop' },
        { label: 'Back in stock', value: 'restock' },
        { label: 'Broadcast', value: 'broadcast' },
        { label: 'System', value: 'system' },
      ],
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'body',
      type: 'textarea',
      required: true,
    },
    {
      name: 'linkUrl',
      type: 'text',
      admin: {
        description: 'Path (e.g. /products/slug) or full URL opened when the notification is clicked.',
      },
    },
    {
      name: 'product',
      type: 'relationship',
      relationTo: 'products',
      admin: {
        description: 'Optional. Used for de-duplication and admin context.',
      },
    },
    {
      name: 'broadcast',
      type: 'relationship',
      relationTo: 'notification-broadcasts',
      admin: {
        description: 'Set when this row was created from a broadcast campaign.',
      },
    },
    {
      name: 'pricePrevious',
      type: 'number',
      admin: {
        description: 'For price-drop alerts: unit price before the change (default currency).',
        position: 'sidebar',
      },
    },
    {
      name: 'priceNow',
      type: 'number',
      admin: {
        description: 'For price-drop alerts: unit price after the change.',
        position: 'sidebar',
      },
    },
    {
      name: 'readAt',
      type: 'date',
      index: true,
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'channels',
      type: 'select',
      hasMany: true,
      admin: {
        description: 'Delivery channels used for this message.',
      },
      options: [
        { label: 'In-app inbox', value: 'inbox' },
        { label: 'Web push', value: 'push' },
      ],
    },
  ],
  timestamps: true,
}
