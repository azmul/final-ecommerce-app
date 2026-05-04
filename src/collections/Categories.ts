import { slugField } from 'payload'
import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/adminOnly'

export const Categories: CollectionConfig = {
  slug: 'categories',
  access: {
    create: adminOnly,
    delete: adminOnly,
    read: () => true,
    update: adminOnly,
  },
  admin: {
    components: {
      beforeListTable: [
        '@/components/admin/ContentTaxonomyDateRangeFilters#CategoryDateRangeFilter',
      ],
    },
    useAsTitle: 'title',
    defaultColumns: ['title', 'image', 'slug'],
    group: 'Content',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
    },
    slugField({
      position: undefined,
    }),
    {
      type: 'join',
      name: 'subcategories',
      label: 'Subcategories',
      collection: 'subcategories',
      on: 'parent',
      admin: {
        defaultColumns: ['title', 'slug'],
      },
    },
  ],
}
