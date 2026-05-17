import { slugField } from 'payload'
import type { CollectionConfig } from 'payload'

import { staffPublicCollectionAccess } from '@/lib/permissions/collectionAccess'

export const Subcategories: CollectionConfig = {
  slug: 'subcategories',
  access: staffPublicCollectionAccess('subcategories'),
  admin: {
    components: {
      beforeListTable: [
        '@/components/admin/ContentTaxonomyDateRangeFilters#SubcategoryDateRangeFilter',
      ],
    },
    useAsTitle: 'title',
    defaultColumns: ['title', 'parent', 'slug'],
    group: 'Content',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
      admin: {
        description: 'Parent category — e.g. "Honey".',
      },
      index: true,
    },
    slugField({
      position: undefined,
    }),
  ],
}
