export type StorageMode = 'local' | 's3'

export type UploadResult = {
  filename: string
  path: string
  storage: StorageMode
  url: string
}

export type UploadFileInput = {
  data: Buffer | Uint8Array
  filename: string
  mimeType: string
  /** Relative folder under the storage root (e.g. `media`, `products`). */
  subdir?: string
}

export type UploadOptions = {
  /** Override auto-detected storage mode. */
  storage?: StorageMode
  subdir?: string
}
