import { staffOrUserOwnedByUserField } from '@/access/adminOrUserOwnedByUserField'
import { adminOrStaff, staffCanViewAdminPage } from '@/access/staffAccess'
import type { CollectionConfig } from 'payload'

export const InventoryReservations: CollectionConfig = {
  slug: 'inventory-reservations',
  admin: {
    defaultColumns: ['cart', 'product', 'variant', 'quantity', 'expiresAt'],
    group: 'Ecommerce',
    useAsTitle: 'id',
  },
  access: {
    admin: staffCanViewAdminPage('carts'),
    create: adminOrStaff('carts', 'create'),
    delete: adminOrStaff('carts', 'delete'),
    read: adminOrStaff('carts', 'read'),
    update: adminOrStaff('carts', 'update'),
  },
  fields: [
    {
      name: 'cart',
      type: 'relationship',
      index: true,
      relationTo: 'carts',
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
      name: 'variant',
      type: 'relationship',
      index: true,
      relationTo: 'variants',
    },
    {
      name: 'quantity',
      type: 'number',
      min: 1,
      required: true,
    },
    {
      name: 'expiresAt',
      type: 'date',
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
      },
      index: true,
      required: true,
    },
  ],
  timestamps: true,
}
