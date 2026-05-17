import path from 'path'

import type { S3ClientConfig } from '@aws-sdk/client-s3'

/** Local directory for Payload `media` collection files (served at `/media/...`). */
export const PAYLOAD_MEDIA_STATIC_DIR = path.resolve(process.cwd(), 'public/media')

/** Default root for programmatic uploads via `uploadFile`. */
export const LOCAL_UPLOAD_ROOT = path.resolve(process.cwd(), 'public/uploads')

export const LOCAL_MEDIA_URL_PREFIX = '/media'
export const LOCAL_UPLOADS_URL_PREFIX = '/uploads'

export const MAX_IMAGE_BYTES = 12 * 1024 * 1024

export const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/avif',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
])

const ALLOWED_IMAGE_EXTENSIONS = new Set(['.avif', '.gif', '.jpeg', '.jpg', '.png', '.webp'])

export function hasAwsCredentials(): boolean {
  return Boolean(
    process.env.S3_ACCESS_KEY_ID?.trim() &&
      process.env.S3_SECRET_ACCESS_KEY?.trim() &&
      process.env.S3_BUCKET?.trim() &&
      process.env.S3_REGION?.trim(),
  )
}

export function getS3Bucket(): string {
  return process.env.S3_BUCKET!.trim()
}

export function getS3Region(): string {
  return process.env.S3_REGION!.trim()
}

export function getAwsClientConfig(): S3ClientConfig {
  const endpoint = process.env.S3_ENDPOINT?.trim()

  return {
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!.trim(),
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!.trim(),
    },
    region: getS3Region(),
    ...(endpoint ?
      {
        endpoint,
        forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== 'false',
      }
    : {}),
  }
}

export function buildS3ObjectKey(filename: string, subdir = 'media'): string {
  const safeSubdir = subdir.replace(/^\/+|\/+$/g, '').replace(/\.\./g, '')
  return safeSubdir ? `${safeSubdir}/${filename}` : filename
}

export function buildLocalPublicUrl(relativePath: string, urlPrefix: string): string {
  const normalized = relativePath.replace(/^\/+/, '')
  return `${urlPrefix}/${normalized}`.replace(/\/+/g, '/')
}

export function isAllowedImageExtension(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase()
  return ALLOWED_IMAGE_EXTENSIONS.has(ext)
}
