import { uploadToLocal } from '@/lib/upload/handlers/local'
import { uploadToR2 } from '@/lib/upload/handlers/r2'
import { uploadLogger } from '@/lib/upload/logger'
import { resolveStorageMode } from '@/lib/upload/resolveStorageMode'
import type { StorageMode, UploadFileInput, UploadOptions, UploadResult } from '@/lib/upload/types'
import { createUniqueFilename, validateImageUpload } from '@/lib/upload/validateFile'

export async function uploadFile(
  input: UploadFileInput,
  options: UploadOptions = {},
): Promise<UploadResult> {
  const { filename } = validateImageUpload(input)
  const uniqueFilename = createUniqueFilename(filename)
  const payload: UploadFileInput = {
    ...input,
    filename,
    subdir: options.subdir ?? input.subdir,
  }

  const mode: StorageMode = options.storage ?? (await resolveStorageMode())

  uploadLogger.info('Uploading file', {
    filename: uniqueFilename,
    mode,
    subdir: payload.subdir ?? 'media',
  })

  if (mode === 'r2') {
    try {
      return await uploadToR2(payload, uniqueFilename)
    } catch (error) {
      uploadLogger.warn('R2 upload failed; falling back to local storage', {
        error: error instanceof Error ? error.message : String(error),
        filename: uniqueFilename,
      })
      return uploadToLocal(payload, uniqueFilename)
    }
  }

  return uploadToLocal(payload, uniqueFilename)
}
