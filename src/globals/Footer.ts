import type { Field, GlobalConfig } from 'payload'

import { staffGlobalAccess } from '@/lib/permissions/collectionAccess'
import { link } from '@/fields/link'
import { revalidateFooter } from '@/globals/hooks/revalidateFooter'

const footerLinkFields: Field[] = [
  link({
    appearances: false,
  }),
]

export const Footer: GlobalConfig = {
  slug: 'footer',
  label: 'Footer',
  access: {
    read: () => true,
    update: staffGlobalAccess('footer').update,
  },
  hooks: {
    afterChange: [revalidateFooter],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Brand & Contact',
          fields: [
            {
              name: 'description',
              type: 'textarea',
              label: 'Description',
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'address',
                  type: 'text',
                  admin: { width: '50%' },
                },
                {
                  name: 'phone',
                  type: 'text',
                  admin: { width: '50%' },
                },
              ],
            },
            {
              name: 'email',
              type: 'email',
            },
            {
              name: 'logo',
              type: 'upload',
              relationTo: 'media',
              label: 'Logo (optional)',
              admin: {
                description: 'Overrides the default site logo in the footer when set.',
              },
            },
            {
              name: 'socialLinks',
              type: 'group',
              label: 'Social Media',
              fields: [
                {
                  name: 'facebook',
                  type: 'text',
                  label: 'Facebook URL',
                },
                {
                  name: 'twitter',
                  type: 'text',
                  label: 'Twitter / X URL',
                },
                {
                  name: 'instagram',
                  type: 'text',
                  label: 'Instagram URL',
                },
              ],
            },
            {
              name: 'appLinks',
              type: 'group',
              label: 'Mobile App Links',
              fields: [
                {
                  name: 'googlePlay',
                  type: 'text',
                  label: 'Google Play URL',
                },
                {
                  name: 'appStore',
                  type: 'text',
                  label: 'App Store URL',
                },
              ],
            },
          ],
        },
        {
          label: 'Navigation Columns',
          description:
            'Manage footer link columns such as Information, Shop By, Support, and Consumer Policy.',
          fields: [
            {
              name: 'linkColumns',
              type: 'array',
              labels: {
                singular: 'Column',
                plural: 'Columns',
              },
              maxRows: 6,
              fields: [
                {
                  name: 'title',
                  type: 'text',
                  required: true,
                  label: 'Column Title',
                },
                {
                  name: 'items',
                  type: 'array',
                  labels: {
                    singular: 'Link',
                    plural: 'Links',
                  },
                  fields: footerLinkFields,
                },
              ],
            },
          ],
        },
        {
          label: 'Copyright',
          fields: [
            {
              name: 'copyrightText',
              type: 'text',
              label: 'Copyright line (optional)',
              admin: {
                description: 'Leave blank to auto-generate from the company name.',
              },
            },
          ],
        },
      ],
    },
  ],
}
