import { staffOrUserOwnedByUserField } from '@/access/adminOrUserOwnedByUserField'
import { adminOrStaff, staffCanViewAdminPage } from '@/access/staffAccess'
import type { CollectionConfig } from 'payload'

export const Subscriptions: CollectionConfig = {
  slug: 'subscriptions',
  admin: {
    defaultColumns: ['active', 'user', 'intervalDays', 'nextOrderAt', 'updatedAt'],
    description: 'Repeat orders for consumables — cron sends reminders and can place orders.',
    group: 'Ecommerce',
    useAsTitle: 'id',
  },
  access: {
    admin: staffCanViewAdminPage('subscriptions'),
    create: adminOrStaff('subscriptions', 'create'),
    delete: staffOrUserOwnedByUserField('subscriptions', 'delete'),
    read: staffOrUserOwnedByUserField('subscriptions', 'view'),
    update: staffOrUserOwnedByUserField('subscriptions', 'edit'),
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      index: true,
      relationTo: 'users',
      required: true,
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      index: true,
    },
    {
      name: 'intervalDays',
      type: 'number',
      defaultValue: 30,
      min: 7,
      required: true,
    },
    {
      name: 'nextOrderAt',
      type: 'date',
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
      },
      index: true,
      required: true,
    },
    {
      name: 'items',
      type: 'array',
      minRows: 1,
      required: true,
      fields: [
        {
          name: 'product',
          type: 'relationship',
          relationTo: 'products',
          required: true,
        },
        {
          name: 'variant',
          type: 'relationship',
          relationTo: 'variants',
        },
        {
          name: 'quantity',
          type: 'number',
          defaultValue: 1,
          min: 1,
          required: true,
        },
      ],
    },
    {
      name: 'shippingAddress',
      type: 'group',
      fields: [
        { name: 'district', type: 'text', required: true },
        { name: 'fullAddress', type: 'textarea', required: true },
      ],
    },
    {
      name: 'lastReminderAt',
      type: 'date',
      admin: { readOnly: true },
    },
    {
      name: 'lastOrderId',
      type: 'relationship',
      relationTo: 'orders',
      admin: { readOnly: true },
    },
  ],
  labels: {
    plural: 'Subscriptions',
    singular: 'Subscription',
  },
}
