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

export function getR2AccessKeyId(): string | undefined {
  return readEnv('R2_ACCESS_KEY_ID')
}

export function getR2SecretAccessKey(): string | undefined {
  return readEnv('R2_SECRET_ACCESS_KEY')
}

export function getR2Bucket(): string {
  return readEnv('R2_BUCKET')!
}

/**
 * S3-compatible API endpoint. Explicit `R2_ENDPOINT` wins; otherwise derived
 * from `R2_ACCOUNT_ID` as `https://<account_id>.r2.cloudflarestorage.com`.
 */
export function getR2Endpoint(): string | undefined {
  const explicit = readEnv('R2_ENDPOINT')
  if (explicit) return explicit

  const accountId = readEnv('R2_ACCOUNT_ID')
  return accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined
}

/** Public base URL for serving files (`https://pub-<hash>.r2.dev` or a custom domain). */
export function getR2PublicUrl(): string | undefined {
  return readEnv('R2_PUBLIC_URL')
}

export function hasR2Credentials(): boolean {
  return Boolean(
    getR2AccessKeyId() && getR2SecretAccessKey() && getR2Bucket() && getR2Endpoint(),
  )
}

export function getR2ClientConfig(): S3ClientConfig {
  return {
    credentials: {
      accessKeyId: getR2AccessKeyId()!,
      secretAccessKey: getR2SecretAccessKey()!,
    },
    endpoint: getR2Endpoint()!,
    // R2 ignores the region; the SDK still requires one.
    region: 'auto',
    forcePathStyle: true,
  }
}

export function buildObjectKey(filename: string, subdir = 'media'): string {
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
