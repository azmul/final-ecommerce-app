import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3'

import { getAwsClientConfig, getS3Bucket, hasAwsCredentials } from '@/lib/upload/config'
import { uploadLogger } from '@/lib/upload/logger'
import type { StorageMode } from '@/lib/upload/types'

let cachedMode: StorageMode | null = null
let verificationPromise: Promise<StorageMode> | null = null

async function verifyS3Access(): Promise<boolean> {
  const client = new S3Client(getAwsClientConfig())

  try {
    await client.send(new HeadBucketCommand({ Bucket: getS3Bucket() }))
    return true
  } finally {
    client.destroy()
  }
}

/**
 * Detects storage mode at runtime. Missing env vars → local. When env vars are set,
 * verifies bucket access once; invalid credentials fall back to local without throwing.
 */
export async function resolveStorageMode(): Promise<StorageMode> {
  if (cachedMode) {
    return cachedMode
  }

  if (!verificationPromise) {
    verificationPromise = (async () => {
      if (!hasAwsCredentials()) {
        uploadLogger.info('AWS S3 env vars not set; using local file storage')
        cachedMode = 'local'
        return cachedMode
      }

      try {
        const ok = await verifyS3Access()
        if (ok) {
          uploadLogger.info('AWS S3 connection verified; using S3 storage', {
            bucket: getS3Bucket(),
          })
          cachedMode = 's3'
          return cachedMode
        }
      } catch (error) {
        uploadLogger.warn(
          'AWS S3 credentials invalid or bucket unreachable; falling back to local storage',
          {
            error: error instanceof Error ? error.message : String(error),
          },
        )
      }

      cachedMode = 'local'
      return cachedMode
    })()
  }

  return verificationPromise
}

/** Sync hint for config: true only when all required S3 env vars are present. */
export function isS3ConfiguredInEnv(): boolean {
  return hasAwsCredentials()
}

/** Reset cached mode (tests only). */
export function resetStorageModeCache(): void {
  cachedMode = null
  verificationPromise = null
}
