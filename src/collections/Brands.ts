import { slugField } from 'payload'
import type { CollectionConfig } from 'payload'

import { taxonomySeoTabFields } from '@/lib/seo/cmsSeoFields'
import { staffPublicCollectionAccess } from '@/lib/permissions/collectionAccess'

export const Brands: CollectionConfig = {
  slug: 'brands',
  access: staffPublicCollectionAccess('brands'),
  admin: {
    components: {
      beforeListTable: ['@/components/admin/ContentTaxonomyDateRangeFilters#BrandDateRangeFilter'],
    },
    defaultColumns: ['title', 'slug', 'image'],
    group: 'Content',
    useAsTitle: 'title',
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
              name: 'description',
              type: 'textarea',
              required: false,
            },
            {
              name: 'image',
              type: 'upload',
              label: 'Brand image',
              relationTo: 'media',
            },
            slugField({
              position: undefined,
            }),
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
