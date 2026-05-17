import type { CollectionConfig } from 'payload'

import { staffOrUserOwnedByUserField } from '@/access/adminOrUserOwnedByUserField'
import { adminOrStaff, staffCanViewAdminPage } from '@/access/staffAccess'

export const NotificationPreferences: CollectionConfig = {
  slug: 'notification-preferences',
  admin: {
    group: 'Notifications',
    defaultColumns: ['user', 'pushEnabled', 'priceDropAlerts', 'stockAlerts', 'updatedAt'],
    useAsTitle: 'id',
  },
  access: {
    admin: staffCanViewAdminPage('notification-preferences'),
    create: adminOrStaff('notification-preferences', 'create'),
    delete: adminOrStaff('notification-preferences', 'delete'),
    read: staffOrUserOwnedByUserField('notification-preferences', 'view'),
    update: staffOrUserOwnedByUserField('notification-preferences', 'edit'),
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
