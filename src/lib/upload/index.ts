export {
  ALLOWED_IMAGE_MIME_TYPES,
  getR2AccessKeyId,
  getR2SecretAccessKey,
  hasR2Credentials,
  LOCAL_MEDIA_URL_PREFIX,
  LOCAL_UPLOAD_ROOT,
  LOCAL_UPLOADS_URL_PREFIX,
  MAX_IMAGE_BYTES,
  PAYLOAD_MEDIA_STATIC_DIR,
} from '@/lib/upload/config'
export { uploadToLocal, uploadMediaToLocal } from '@/lib/upload/handlers/local'
export { uploadToR2 } from '@/lib/upload/handlers/r2'
export { uploadLogger } from '@/lib/upload/logger'
export {
  isR2ConfiguredInEnv,
  resetStorageModeCache,
  resolveStorageMode,
} from '@/lib/upload/resolveStorageMode'
export { createR2StoragePlugin } from '@/lib/upload/r2StoragePlugin'
export type { StorageMode, UploadFileInput, UploadOptions, UploadResult } from '@/lib/upload/types'
export { uploadFile } from '@/lib/upload/uploadFile'
export {
  createUniqueFilename,
  sanitizeFilename,
  UploadValidationError,
  validateImageUpload,
} from '@/lib/upload/validateFile'
