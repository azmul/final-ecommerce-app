import { staffCollectionAccess } from '@/lib/permissions/collectionAccess'
import type { CollectionConfig } from 'payload'

export const LoyaltyTransactions: CollectionConfig = {
  slug: 'loyalty-transactions',
  admin: {
    defaultColumns: ['type', 'points', 'user', 'order', 'balanceAfter', 'createdAt'],
    description: 'Earn and redeem events for the loyalty points program.',
    group: 'Ecommerce',
    useAsTitle: 'id',
  },
  access: staffCollectionAccess('loyalty-transactions'),
  fields: [
    {
      name: 'user',
      type: 'relationship',
      index: true,
      relationTo: 'users',
      required: true,
    },
    {
      name: 'type',
      type: 'select',
      index: true,
      options: [
        { label: 'Earned', value: 'earn' },
        { label: 'Redeemed', value: 'redeem' },
      ],
      required: true,
    },
    {
      name: 'points',
      type: 'number',
      min: 1,
      required: true,
    },
    {
      name: 'order',
      type: 'relationship',
      relationTo: 'orders',
    },
    {
      name: 'description',
      type: 'text',
      required: true,
    },
    {
      name: 'balanceAfter',
      type: 'number',
      admin: {
        readOnly: true,
      },
      min: 0,
    },
  ],
  labels: {
    plural: 'Loyalty Transactions',
    singular: 'Loyalty Transaction',
  },
}
