import { s3Storage } from '@payloadcms/storage-s3'
import type { Plugin } from 'payload'

import { getAwsClientConfig, getS3Bucket } from '@/lib/upload/config'

/** Payload plugin: stores `media` collection uploads in S3 when enabled. */
export function createS3StoragePlugin(): Plugin {
  return s3Storage({
    acl: process.env.S3_ACL === 'private' ? 'private' : 'public-read',
    bucket: getS3Bucket(),
    collections: {
      media: true,
    },
    config: getAwsClientConfig(),
    disableLocalStorage: true,
  })
}
