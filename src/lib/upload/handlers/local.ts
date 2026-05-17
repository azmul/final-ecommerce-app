import { mkdir, writeFile } from 'fs/promises'
import path from 'path'

import {
  buildLocalPublicUrl,
  LOCAL_MEDIA_URL_PREFIX,
  LOCAL_UPLOAD_ROOT,
  LOCAL_UPLOADS_URL_PREFIX,
  PAYLOAD_MEDIA_STATIC_DIR,
} from '@/lib/upload/config'
import { uploadLogger } from '@/lib/upload/logger'
import type { UploadFileInput, UploadResult } from '@/lib/upload/types'

type LocalUploadOptions = {
  rootDir?: string
  urlPrefix?: string
}

export async function uploadToLocal(
  input: UploadFileInput,
  uniqueFilename: string,
  options: LocalUploadOptions = {},
): Promise<UploadResult> {
  const rootDir = options.rootDir ?? LOCAL_UPLOAD_ROOT
  const urlPrefix = options.urlPrefix ?? LOCAL_UPLOADS_URL_PREFIX
  const subdir = input.subdir ?? 'media'
  const relativePath = path.posix.join(subdir, uniqueFilename)
  const absolutePath = path.join(rootDir, subdir, uniqueFilename)

  await mkdir(path.dirname(absolutePath), { recursive: true })
  await writeFile(absolutePath, input.data)

  const url = buildLocalPublicUrl(relativePath, urlPrefix)

  uploadLogger.info('Saved file to local storage', { path: absolutePath, url })

  return {
    filename: uniqueFilename,
    path: absolutePath,
    storage: 'local',
    url,
  }
}

/** Payload media collection local handler (served from `public/media`). */
export async function uploadMediaToLocal(
  input: UploadFileInput,
  uniqueFilename: string,
): Promise<UploadResult> {
  return uploadToLocal(
    { ...input, subdir: '' },
    uniqueFilename,
    {
      rootDir: PAYLOAD_MEDIA_STATIC_DIR,
      urlPrefix: LOCAL_MEDIA_URL_PREFIX,
    },
  )
}
