import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

import {
  buildObjectKey,
  getR2Bucket,
  getR2ClientConfig,
  getR2Endpoint,
  getR2PublicUrl,
} from '@/lib/upload/config'
import { uploadLogger } from '@/lib/upload/logger'
import type { UploadFileInput, UploadResult } from '@/lib/upload/types'

function buildPublicR2Url(key: string): string {
  // R2 objects are only publicly reachable via the r2.dev subdomain or a
  // custom domain configured on the bucket — the S3 API endpoint requires
  // signed requests. Set R2_PUBLIC_URL for public access.
  const publicBase = getR2PublicUrl()?.replace(/\/$/, '')
  if (publicBase) {
    return `${publicBase}/${key}`
  }

  const endpoint = getR2Endpoint()!.replace(/\/$/, '')
  return `${endpoint}/${getR2Bucket()}/${key}`
}

export async function uploadToR2(
  input: UploadFileInput,
  uniqueFilename: string,
): Promise<UploadResult> {
  const subdir = input.subdir ?? 'media'
  const key = buildObjectKey(uniqueFilename, subdir)
  const client = new S3Client(getR2ClientConfig())

  try {
    await client.send(
      new PutObjectCommand({
        Body: input.data,
        Bucket: getR2Bucket(),
        ContentType: input.mimeType,
        Key: key,
      }),
    )
  } finally {
    client.destroy()
  }

  const url = buildPublicR2Url(key)

  uploadLogger.info('Uploaded file to R2', { bucket: getR2Bucket(), key, url })

  return {
    filename: uniqueFilename,
    path: key,
    storage: 'r2',
    url,
  }
}
