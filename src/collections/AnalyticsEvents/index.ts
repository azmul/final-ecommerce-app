import { staffCollectionAccess } from '@/lib/permissions/collectionAccess'
import type { CollectionConfig } from 'payload'

export const AnalyticsEvents: CollectionConfig = {
  slug: 'analytics-events',
  admin: {
    defaultColumns: ['eventType', 'product', 'user', 'sessionId', 'createdAt'],
    description: 'Server-side storefront funnel events for ops analytics.',
    group: 'Analysis',
    useAsTitle: 'id',
  },
  access: {
    ...staffCollectionAccess('analytics-events'),
    create: () => true,
  },
  fields: [
    {
      name: 'eventType',
      type: 'select',
      index: true,
      options: [
        { label: 'Product view', value: 'product_view' },
        { label: 'Add to cart', value: 'add_to_cart' },
        { label: 'Begin checkout', value: 'begin_checkout' },
        { label: 'Add payment info', value: 'add_payment_info' },
        { label: 'Purchase', value: 'purchase' },
        { label: 'Search', value: 'search' },
        { label: 'Lead', value: 'lead' },
        { label: 'Complete registration', value: 'complete_registration' },
      ],
      required: true,
    },
    {
      name: 'sessionId',
      type: 'text',
      index: true,
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'product',
      type: 'relationship',
      relationTo: 'products',
    },
    {
      name: 'cart',
      type: 'relationship',
      relationTo: 'carts',
    },
    {
      name: 'order',
      type: 'relationship',
      relationTo: 'orders',
    },
    {
      name: 'metadata',
      type: 'json',
      admin: {
        description: 'Optional event payload (quantity, path, etc.).',
      },
    },
  ],
  labels: {
    plural: 'Analytics Events',
    singular: 'Analytics Event',
  },
}
