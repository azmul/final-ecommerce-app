import { slugField } from 'payload'
import type { CollectionConfig } from 'payload'

import { taxonomySeoTabFields } from '@/lib/seo/cmsSeoFields'
import { taxonomyGeoContentFields } from '@/lib/seo/taxonomyGeoContentFields'
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
            {
              type: 'group',
              name: 'aboutBrand',
              label: 'About brand',
              fields: [
                {
                  name: 'foundedDate',
                  type: 'date',
                  admin: { description: 'Year/date the brand was founded' },
                },
                {
                  name: 'headquarters',
                  type: 'text',
                  admin: { description: 'City, Country' },
                },
                {
                  name: 'officialWebsite',
                  type: 'text',
                  admin: { description: 'Official brand site URL (will appear in JSON-LD sameAs)' },
                },
                {
                  name: 'sameAs',
                  type: 'array',
                  fields: [{ name: 'url', type: 'text', required: true }],
                  admin: { description: 'Other authoritative URLs about this brand' },
                },
                {
                  name: 'areaServed',
                  type: 'text',
                  admin: { description: 'Geographic markets served, e.g., Bangladesh, South Asia' },
                },
                {
                  name: 'warrantyPolicy',
                  type: 'richText',
                  admin: { description: 'Optional. Surfaces in Brand JSON-LD and brand page.' },
                },
              ],
            },
          ],
        },
        {
          label: 'AI & GEO',
          fields: [taxonomyGeoContentFields()],
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
