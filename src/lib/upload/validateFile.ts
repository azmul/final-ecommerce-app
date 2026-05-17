import path from 'path'

import {
  ALLOWED_IMAGE_MIME_TYPES,
  isAllowedImageExtension,
  MAX_IMAGE_BYTES,
} from '@/lib/upload/config'

export class UploadValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UploadValidationError'
  }
}

export function sanitizeFilename(filename: string): string {
  const base = path.basename(filename).trim()
  const sanitized = base
    .replace(/[^\w.\-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^\.+/, '')
    .slice(0, 200)

  return sanitized || 'upload'
}

export function validateImageUpload(input: {
  data: Buffer | Uint8Array
  filename: string
  mimeType: string
}): { filename: string; size: number } {
  const size = input.data.byteLength

  if (size === 0) {
    throw new UploadValidationError('File is empty.')
  }

  if (size > MAX_IMAGE_BYTES) {
    throw new UploadValidationError(
      `File exceeds maximum size of ${Math.floor(MAX_IMAGE_BYTES / (1024 * 1024))}MB.`,
    )
  }

  const mimeType = input.mimeType.trim().toLowerCase()
  if (!ALLOWED_IMAGE_MIME_TYPES.has(mimeType)) {
    throw new UploadValidationError(`Unsupported image type: ${mimeType || 'unknown'}.`)
  }

  const filename = sanitizeFilename(input.filename)
  if (!isAllowedImageExtension(filename)) {
    throw new UploadValidationError('Unsupported file extension.')
  }

  return { filename, size }
}

export function createUniqueFilename(filename: string): string {
  const ext = path.extname(filename)
  const stem = path.basename(filename, ext) || 'upload'
  const stamp = Date.now()
  const random = Math.random().toString(36).slice(2, 10)
  return `${stamp}-${random}-${stem}${ext}`
}
