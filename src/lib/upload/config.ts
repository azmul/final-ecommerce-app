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

function readEnv(...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = process.env[key]?.trim()
    if (value) return value
  }
  return undefined
}

/** Access key from `S3_ACCESS_KEY_ID` or standard `AWS_ACCESS_KEY_ID`. */
export function getS3AccessKeyId(): string | undefined {
  return readEnv('S3_ACCESS_KEY_ID', 'AWS_ACCESS_KEY_ID')
}

/** Secret from `S3_SECRET_ACCESS_KEY` or standard `AWS_SECRET_ACCESS_KEY`. */
export function getS3SecretAccessKey(): string | undefined {
  return readEnv('S3_SECRET_ACCESS_KEY', 'AWS_SECRET_ACCESS_KEY')
}

export function getS3Bucket(): string {
  return readEnv('S3_BUCKET', 'AWS_S3_BUCKET')!
}

export function getS3Region(): string {
  return readEnv('S3_REGION', 'AWS_REGION', 'AWS_DEFAULT_REGION')!
}

export function hasAwsCredentials(): boolean {
  return Boolean(getS3AccessKeyId() && getS3SecretAccessKey() && getS3Bucket() && getS3Region())
}

export function getAwsClientConfig(): S3ClientConfig {
  const endpoint = process.env.S3_ENDPOINT?.trim()

  return {
    credentials: {
      accessKeyId: getS3AccessKeyId()!,
      secretAccessKey: getS3SecretAccessKey()!,
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
