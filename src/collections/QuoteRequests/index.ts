import { staffCollectionAccess } from '@/lib/permissions/collectionAccess'
import type { CollectionConfig } from 'payload'

export const QuoteRequests: CollectionConfig = {
  slug: 'quote-requests',
  admin: {
    defaultColumns: ['status', 'product', 'quantity', 'companyName', 'contactName', 'createdAt'],
    description: 'B2B / bulk quote requests submitted from product pages.',
    group: 'Ecommerce',
    useAsTitle: 'id',
  },
  access: staffCollectionAccess('quote-requests'),
  fields: [
    {
      name: 'status',
      type: 'select',
      defaultValue: 'new',
      index: true,
      options: [
        { label: 'New', value: 'new' },
        { label: 'In review', value: 'in_review' },
        { label: 'Quoted', value: 'quoted' },
        { label: 'Won', value: 'won' },
        { label: 'Lost', value: 'lost' },
        { label: 'Closed', value: 'closed' },
      ],
      required: true,
    },
    {
      name: 'product',
      type: 'relationship',
      index: true,
      relationTo: 'products',
      required: true,
    },
    {
      name: 'quantity',
      type: 'number',
      min: 1,
      required: true,
    },
    {
      name: 'companyName',
      type: 'text',
      required: true,
    },
    {
      name: 'contactName',
      type: 'text',
      required: true,
    },
    {
      name: 'email',
      type: 'email',
      required: true,
    },
    {
      name: 'phone',
      type: 'text',
    },
    {
      name: 'message',
      type: 'textarea',
    },
    {
      name: 'quotedAmount',
      type: 'number',
      admin: {
        description: 'Optional quoted total in BDT.',
      },
      min: 0,
    },
    {
      name: 'staffNote',
      type: 'textarea',
      admin: {
        description: 'Internal follow-up notes.',
      },
    },
    {
      name: 'customer',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        readOnly: true,
      },
    },
  ],
  labels: {
    plural: 'Quote Requests',
    singular: 'Quote Request',
  },
}
