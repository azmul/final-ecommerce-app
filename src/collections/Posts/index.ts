import type { CollectionConfig } from 'payload'

import { generatePreviewPath } from '@/utilities/generatePreviewPath'
import { staffDraftCollectionAccess } from '@/lib/permissions/collectionAccess'
import { slugField } from 'payload'
import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'

import { postGeoContentFields } from '@/lib/seo/postGeoContentFields'
import { parseYoutubeVideoId } from '@/utilities/youtube'

import { revalidateDeletePost, revalidatePost } from './hooks/revalidatePost'

export const Posts: CollectionConfig = {
  slug: 'posts',
  access: staffDraftCollectionAccess('posts'),
  admin: {
    group: 'Content',
    defaultColumns: ['title', 'publishedOn', 'slug', '_status'],
    useAsTitle: 'title',
    livePreview: {
      url: ({ data, req }) =>
        generatePreviewPath({
          slug: data?.slug as string,
          collection: 'posts',
          req,
        }),
    },
    preview: (data, { req }) =>
      generatePreviewPath({
        slug: data?.slug as string,
        collection: 'posts',
        req,
      }),
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'contentType',
      type: 'select',
      defaultValue: 'article',
      options: [
        { label: 'Article', value: 'article' },
        { label: 'Buying guide', value: 'buying-guide' },
        { label: 'Product comparison', value: 'comparison' },
        { label: 'How-to', value: 'how-to' },
        { label: 'FAQ roundup', value: 'faq' },
        { label: 'Trend / news', value: 'trend' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Helps organize content for SEO and AI discovery.',
      },
    },
    {
      name: 'publishedOn',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        position: 'sidebar',
      },
      hooks: {
        beforeChange: [
          ({ siblingData, value }) => {
            if (siblingData._status === 'published' && !value) {
              return new Date()
            }
            return value
          },
        ],
      },
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'relatedPosts',
      type: 'relationship',
      relationTo: 'posts',
      hasMany: true,
      filterOptions: ({ id }) => {
        if (id) {
          return {
            id: {
              not_in: [id],
            },
          }
        }
        return {
          id: {
            exists: true,
          },
        }
      },
      admin: {
        position: 'sidebar',
        description: 'Suggested posts displayed in the sidebar while editing this post.',
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          fields: [
            {
              name: 'excerpt',
              type: 'textarea',
              admin: {
                description: 'Short summary shown on the blog index.',
              },
            },
            {
              name: 'featuredYoutubeUrl',
              type: 'text',
              admin: {
                description:
                  'Paste a watch, shorts, embed, or youtu.be link. When set, the blog index shows that video thumbnail instead of Featured image.',
                placeholder: 'https://www.youtube.com/watch?v=…',
              },
              validate: (value: string | null | undefined) => {
                if (value == null) return true
                if (typeof value === 'string' && value.trim() === '') return true
                return parseYoutubeVideoId(String(value)) ? true : 'Enter a valid YouTube URL.'
              },
            },
            {
              name: 'featuredImage',
              type: 'upload',
              relationTo: 'media',
              admin: {
                description:
                  'Displayed on listing and article. Use Featured YouTube URL to show a video thumbnail on the blog index instead of this image.',
              },
            },
            {
              name: 'content',
              type: 'richText',
              required: true,
            },
          ],
          label: 'Article',
        },
        {
          label: 'AI & GEO',
          fields: [postGeoContentFields()],
        },
        {
          name: 'meta',
          label: 'SEO',
          fields: [
            OverviewField({
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
              imagePath: 'meta.image',
            }),
            MetaTitleField({
              hasGenerateFn: true,
            }),
            MetaImageField({
              relationTo: 'media',
            }),
            MetaDescriptionField({}),
            PreviewField({
              hasGenerateFn: true,
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
            }),
          ],
        },
      ],
    },
    slugField(),
  ],
  hooks: {
    afterChange: [revalidatePost],
    afterDelete: [revalidateDeletePost],
  },
  versions: {
    drafts: {
      autosave: true,
    },
    maxPerDoc: 50,
  },
}
