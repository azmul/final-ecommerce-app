import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

import {
  buildS3ObjectKey,
  getAwsClientConfig,
  getS3Bucket,
  getS3Region,
} from '@/lib/upload/config'
import { uploadLogger } from '@/lib/upload/logger'
import type { UploadFileInput, UploadResult } from '@/lib/upload/types'

function buildPublicS3Url(key: string): string {
  const publicBase = process.env.S3_PUBLIC_URL?.trim().replace(/\/$/, '')
  if (publicBase) {
    return `${publicBase}/${key}`
  }

  const endpoint = process.env.S3_ENDPOINT?.trim().replace(/\/$/, '')
  const bucket = getS3Bucket()
  const region = getS3Region()

  if (endpoint) {
    return `${endpoint}/${bucket}/${key}`
  }

  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`
}

export async function uploadToS3(
  input: UploadFileInput,
  uniqueFilename: string,
): Promise<UploadResult> {
  const subdir = input.subdir ?? 'media'
  const key = buildS3ObjectKey(uniqueFilename, subdir)
  const client = new S3Client(getAwsClientConfig())

  try {
    await client.send(
      new PutObjectCommand({
        Body: input.data,
        Bucket: getS3Bucket(),
        ContentType: input.mimeType,
        Key: key,
        ACL: process.env.S3_ACL === 'private' ? 'private' : 'public-read',
      }),
    )
  } finally {
    client.destroy()
  }

  const url = buildPublicS3Url(key)

  uploadLogger.info('Uploaded file to S3', { bucket: getS3Bucket(), key, url })

  return {
    filename: uniqueFilename,
    path: key,
    storage: 's3',
    url,
  }
}
