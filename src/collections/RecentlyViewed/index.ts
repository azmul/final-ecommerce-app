import { staffOrUserOwnedByUserField } from '@/access/adminOrUserOwnedByUserField'
import { adminOrStaff, staffCanViewAdminPage } from '@/access/staffAccess'
import type { CollectionConfig } from 'payload'

export const RecentlyViewed: CollectionConfig = {
  slug: 'recently-viewed',
  admin: {
    defaultColumns: ['user', 'product', 'viewedAt'],
    group: 'Ecommerce',
    useAsTitle: 'id',
  },
  access: {
    admin: staffCanViewAdminPage('recently-viewed'),
    create: adminOrStaff('recently-viewed', 'create'),
    delete: staffOrUserOwnedByUserField('recently-viewed', 'delete'),
    read: staffOrUserOwnedByUserField('recently-viewed', 'view'),
    update: staffOrUserOwnedByUserField('recently-viewed', 'edit'),
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
      name: 'product',
      type: 'relationship',
      index: true,
      relationTo: 'products',
      required: true,
    },
    {
      name: 'viewedAt',
      type: 'date',
      index: true,
      required: true,
    },
  ],
  labels: {
    plural: 'Recently Viewed',
    singular: 'Recently Viewed',
  },
}
