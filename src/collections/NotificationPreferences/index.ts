import type { CollectionConfig } from 'payload'

import { adminOrUserOwnedByUserField } from '@/access/adminOrUserOwnedByUserField'
import { isAdmin } from '@/access/isAdmin'

export const NotificationPreferences: CollectionConfig = {
  slug: 'notification-preferences',
  admin: {
    group: 'Notifications',
    defaultColumns: ['user', 'pushEnabled', 'priceDropAlerts', 'stockAlerts', 'updatedAt'],
    useAsTitle: 'id',
  },
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: adminOrUserOwnedByUserField,
    update: adminOrUserOwnedByUserField,
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'pushEnabled',
      type: 'checkbox',
      defaultValue: true,
      label: 'Browser & device push',
    },
    {
      name: 'priceDropAlerts',
      type: 'checkbox',
      defaultValue: true,
      label: 'Price drop alerts',
    },
    {
      name: 'stockAlerts',
      type: 'checkbox',
      defaultValue: true,
      label: 'Back in stock alerts',
    },
    {
      name: 'orderUpdates',
      type: 'checkbox',
      defaultValue: true,
      label: 'Order status updates',
    },
    {
      name: 'marketingOptIn',
      type: 'checkbox',
      defaultValue: false,
      label: 'Promotional & broadcast messages',
    },
  ],
  timestamps: true,
}
