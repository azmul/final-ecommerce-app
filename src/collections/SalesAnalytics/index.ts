import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'
import { checkRole } from '@/access/utilities'

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
    admin: ({ req: { user } }) => Boolean(user && checkRole(['admin'], user)),
    create: () => false,
    delete: () => false,
    read: adminOnly,
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
