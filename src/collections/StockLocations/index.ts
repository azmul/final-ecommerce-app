import { staffCollectionAccess } from '@/lib/permissions/collectionAccess'
import type { CollectionConfig } from 'payload'

export const StockLocations: CollectionConfig = {
  slug: 'stock-locations',
  admin: {
    defaultColumns: ['name', 'district', 'isDefault', 'active', 'updatedAt'],
    description: 'Warehouses and fulfillment locations for multi-location inventory.',
    group: 'Ecommerce',
    useAsTitle: 'name',
  },
  access: staffCollectionAccess('stock-locations'),
  fields: [
    {
      name: 'name',
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
      name: 'district',
      type: 'text',
      admin: {
        description: 'Optional district match for fulfillment (e.g. Dhaka).',
      },
    },
    {
      name: 'isDefault',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Used when no district-specific location matches checkout.',
      },
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'internalNote',
      type: 'textarea',
      admin: {
        description: 'Staff-only note about this location.',
      },
    },
  ],
  labels: {
    plural: 'Stock Locations',
    singular: 'Stock Location',
  },
}
