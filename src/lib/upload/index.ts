export {
  ALLOWED_IMAGE_MIME_TYPES,
  getS3AccessKeyId,
  getS3SecretAccessKey,
  hasAwsCredentials,
  LOCAL_MEDIA_URL_PREFIX,
  LOCAL_UPLOAD_ROOT,
  LOCAL_UPLOADS_URL_PREFIX,
  MAX_IMAGE_BYTES,
  PAYLOAD_MEDIA_STATIC_DIR,
} from '@/lib/upload/config'
export { uploadToLocal, uploadMediaToLocal } from '@/lib/upload/handlers/local'
export { uploadToS3 } from '@/lib/upload/handlers/s3'
export { uploadLogger } from '@/lib/upload/logger'
export {
  isS3ConfiguredInEnv,
  resetStorageModeCache,
  resolveStorageMode,
} from '@/lib/upload/resolveStorageMode'
export { createS3StoragePlugin } from '@/lib/upload/s3StoragePlugin'
export type { StorageMode, UploadFileInput, UploadOptions, UploadResult } from '@/lib/upload/types'
export { uploadFile } from '@/lib/upload/uploadFile'
export {
  createUniqueFilename,
  sanitizeFilename,
  UploadValidationError,
  validateImageUpload,
} from '@/lib/upload/validateFile'
