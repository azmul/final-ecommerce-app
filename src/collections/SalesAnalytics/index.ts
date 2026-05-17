import type { CollectionConfig } from 'payload'

import { adminOrStaff, staffCanViewAdminPage } from '@/access/staffAccess'

/**
 * Nav-only collection: the list view renders the sales dashboard UI.
 * Registered after Ecommerce collections so the Analysis group appears in a sensible order.
 */
export const SalesAnalytics: CollectionConfig = {
  slug: 'sales-dashboard',
  labels: {
    singular: 'Sales Dashboard',
    plural: 'Sales Dashboard',
  },
  admin: {
    group: 'Analysis',
    description: 'Revenue, orders, carts, and store performance',
    components: {
      views: {
        list: {
          Component: '@/components/admin/SalesDashboard#SalesDashboard',
        },
      },
    },
    defaultColumns: [],
    useAsTitle: 'title',
  },
  access: {
    admin: staffCanViewAdminPage('sales-dashboard'),
    create: () => false,
    delete: () => false,
    read: adminOrStaff('sales-dashboard', 'read'),
    update: () => false,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      defaultValue: 'Sales Dashboard',
      admin: {
        hidden: true,
      },
    },
  ],
}
