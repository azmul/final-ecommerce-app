import type { CollectionConfig } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { staffPublicCollectionAccess } from '@/lib/permissions/collectionAccess'
import { PAYLOAD_MEDIA_STATIC_DIR } from '@/lib/upload/config'
import type { StorageMode } from '@/lib/upload/types'

export function createMediaCollection(storageMode: StorageMode): CollectionConfig {
  return {
    admin: {
      group: 'Content',
    },
    slug: 'media',
    access: staffPublicCollectionAccess('media'),
    fields: [
      {
        name: 'alt',
        type: 'text',
        required: true,
      },
      {
        name: 'caption',
        type: 'richText',
        editor: lexicalEditor({
          features: ({ rootFeatures }) => {
            return [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature()]
          },
        }),
      },
    ],
    upload:
      storageMode === 'r2' ?
        {
          mimeTypes: ['image/*'],
        }
      : {
          mimeTypes: ['image/*'],
          staticDir: PAYLOAD_MEDIA_STATIC_DIR,
        },
  }
}
