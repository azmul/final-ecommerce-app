import { s3Storage } from '@payloadcms/storage-s3'
import type { Plugin } from 'payload'

import { getR2Bucket, getR2ClientConfig } from '@/lib/upload/config'

/**
 * Payload plugin: stores `media` collection uploads in Cloudflare R2 when
 * enabled. R2 is S3-compatible, so the official S3 storage adapter is used
 * with the R2 endpoint. No ACL — R2 does not support object ACLs; public
 * access is granted per-bucket via r2.dev or a custom domain.
 */
export function createR2StoragePlugin(): Plugin {
  return s3Storage({
    bucket: getR2Bucket(),
    collections: {
      media: true,
    },
    config: getR2ClientConfig(),
    disableLocalStorage: true,
  })
}
