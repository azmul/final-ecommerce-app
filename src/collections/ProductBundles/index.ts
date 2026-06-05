import { staffCollectionAccess } from '@/lib/permissions/collectionAccess'
import type { CollectionConfig } from 'payload'

export const ProductBundles: CollectionConfig = {
  slug: 'product-bundles',
  admin: {
    defaultColumns: ['title', 'bundlePrice', 'active', 'updatedAt'],
    description: 'Combo offers — customers add all items at the bundle price.',
    group: 'Ecommerce',
    useAsTitle: 'title',
  },
  access: staffCollectionAccess('product-bundles'),
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      index: true,
      unique: true,
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      index: true,
    },
    {
      name: 'bundlePrice',
      type: 'number',
      admin: {
        description: 'Total bundle price in BDT (discount applied in cart).',
      },
      min: 0,
      required: true,
    },
    {
      name: 'badgeLabel',
      type: 'text',
      admin: {
        description: 'Optional label, e.g. "Combo deal".',
      },
    },
    {
      name: 'items',
      type: 'array',
      minRows: 2,
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
      labels: {
        plural: 'Bundle items',
        singular: 'Bundle item',
      },
    },
  ],
  labels: {
    plural: 'Product Bundles',
    singular: 'Product Bundle',
  },
}
