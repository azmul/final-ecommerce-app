import { adminOrStaff, staffCanViewAdminPage } from '@/access/staffAccess'
import type { CollectionConfig } from 'payload'

export const AdminAuditLogs: CollectionConfig = {
  slug: 'admin-audit-logs',
  admin: {
    defaultColumns: ['action', 'collection', 'documentId', 'actor', 'createdAt'],
    group: 'Admin',
    useAsTitle: 'action',
  },
  access: {
    create: adminOrStaff('orders', 'create'),
    delete: adminOrStaff('orders', 'delete'),
    read: staffCanViewAdminPage('orders'),
    update: () => false,
  },
  fields: [
    {
      name: 'action',
      type: 'text',
      required: true,
    },
    {
      name: 'collection',
      type: 'text',
      index: true,
      required: true,
    },
    {
      name: 'documentId',
      type: 'text',
      index: true,
    },
    {
      name: 'actor',
      type: 'relationship',
      index: true,
      relationTo: 'users',
    },
    {
      name: 'summary',
      type: 'textarea',
    },
    {
      name: 'metadata',
      type: 'json',
    },
  ],
  timestamps: true,
}
