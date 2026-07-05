import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3'

import { getR2Bucket, getR2ClientConfig, hasR2Credentials } from '@/lib/upload/config'
import { uploadLogger } from '@/lib/upload/logger'
import type { StorageMode } from '@/lib/upload/types'

let cachedMode: StorageMode | null = null
let verificationPromise: Promise<StorageMode> | null = null

async function verifyR2Access(): Promise<boolean> {
  const client = new S3Client(getR2ClientConfig())

  try {
    await client.send(new HeadBucketCommand({ Bucket: getR2Bucket() }))
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
      if (!hasR2Credentials()) {
        uploadLogger.info('Cloudflare R2 env vars not set; using local file storage')
        cachedMode = 'local'
        return cachedMode
      }

      try {
        const ok = await verifyR2Access()
        if (ok) {
          uploadLogger.info('Cloudflare R2 connection verified; using R2 storage', {
            bucket: getR2Bucket(),
          })
          cachedMode = 'r2'
          return cachedMode
        }
      } catch (error) {
        uploadLogger.warn(
          'Cloudflare R2 credentials invalid or bucket unreachable; falling back to local storage',
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

/** Sync hint for config: true only when all required R2 env vars are present. */
export function isR2ConfiguredInEnv(): boolean {
  return hasR2Credentials()
}

/** Reset cached mode (tests only). */
export function resetStorageModeCache(): void {
  cachedMode = null
  verificationPromise = null
}
