import { s3Storage } from '@payloadcms/storage-s3'
import type { Plugin } from 'payload'

import { getR2Bucket, getR2ClientConfig, getR2PublicUrl } from '@/lib/upload/config'

/**
 * Payload plugin: stores `media` collection uploads in Cloudflare R2 when
 * enabled. R2 is S3-compatible, so the official S3 storage adapter is used
 * with the R2 endpoint. No ACL — R2 does not support object ACLs; public
 * access is granted per-bucket via r2.dev or a custom domain.
 *
 * With `R2_PUBLIC_URL` set, media URLs point straight at the public bucket
 * (served from Cloudflare's edge). Without it, Payload streams files through
 * `/api/media/file/...`, which works on a private bucket.
 */
export function createR2StoragePlugin(): Plugin {
  const publicBase = getR2PublicUrl()?.replace(/\/$/, '')

  return s3Storage({
    bucket: getR2Bucket(),
    collections: {
      media:
        publicBase ?
          {
            disablePayloadAccessControl: true,
            generateFileURL: ({ filename, prefix }) =>
              [publicBase, prefix, filename].filter(Boolean).join('/'),
          }
        : true,
    },
    config: getR2ClientConfig(),
    disableLocalStorage: true,
  })
}
