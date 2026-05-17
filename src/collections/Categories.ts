import { slugField } from 'payload'
import type { CollectionConfig } from 'payload'

import { taxonomySeoTabFields } from '@/lib/seo/cmsSeoFields'
import { staffPublicCollectionAccess } from '@/lib/permissions/collectionAccess'

export const Categories: CollectionConfig = {
  slug: 'categories',
  access: staffPublicCollectionAccess('categories'),
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
      type: 'tabs',
      tabs: [
        {
          label: 'Details',
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
        },
        {
          name: 'meta',
          label: 'SEO',
          fields: taxonomySeoTabFields(),
        },
      ],
    },
  ],
}
