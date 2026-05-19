import { mkdir, readFile, rm } from 'fs/promises'
import path from 'path'

import { hasAwsCredentials } from '@/lib/upload/config'
import { uploadToLocal } from '@/lib/upload/handlers/local'
import {
  resetStorageModeCache,
  resolveStorageMode,
} from '@/lib/upload/resolveStorageMode'
import { uploadFile } from '@/lib/upload/uploadFile'
import { UploadValidationError, validateImageUpload } from '@/lib/upload/validateFile'
import { afterEach, describe, expect, it } from 'vitest'

const tmpRoot = path.join(process.cwd(), 'public/uploads/test-tmp')

afterEach(async () => {
  resetStorageModeCache()
  await rm(tmpRoot, { recursive: true, force: true })
  await rm(path.join(process.cwd(), 'public/uploads/products'), { recursive: true, force: true })
})

describe('upload utilities', () => {
  it('validates allowed image types and size', () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47])
    const result = validateImageUpload({
      data: png,
      filename: 'photo.PNG',
      mimeType: 'image/png',
    })

    expect(result.filename).toBe('photo.PNG')
    expect(result.size).toBe(4)
  })

  it('rejects unsupported mime types', () => {
    expect(() =>
      validateImageUpload({
        data: Buffer.from('hello'),
        filename: 'doc.pdf',
        mimeType: 'application/pdf',
      }),
    ).toThrow(UploadValidationError)
  })

  it('saves files to local storage with a unified response shape', async () => {
    await mkdir(tmpRoot, { recursive: true })

    const result = await uploadToLocal(
      {
        data: Buffer.from('fake-image'),
        filename: 'sample.jpg',
        mimeType: 'image/jpeg',
        subdir: 'products',
      },
      '123-sample.jpg',
      { rootDir: tmpRoot, urlPrefix: '/uploads' },
    )

    const onDisk = await readFile(path.join(tmpRoot, 'products', '123-sample.jpg'))

    expect(onDisk.toString()).toBe('fake-image')
    expect(result).toMatchObject({
      filename: '123-sample.jpg',
      storage: 'local',
      url: '/uploads/products/123-sample.jpg',
    })
    expect(result.path).toContain(path.join('products', '123-sample.jpg'))
  })

  it('accepts standard AWS_* env var aliases', () => {
    const keys = [
      'S3_ACCESS_KEY_ID',
      'S3_SECRET_ACCESS_KEY',
      'S3_BUCKET',
      'S3_REGION',
      'AWS_ACCESS_KEY_ID',
      'AWS_SECRET_ACCESS_KEY',
      'AWS_REGION',
    ] as const
    const saved: Partial<Record<(typeof keys)[number], string | undefined>> = {}

    for (const key of keys) {
      saved[key] = process.env[key]
      delete process.env[key]
    }

    process.env.AWS_ACCESS_KEY_ID = 'test-key'
    process.env.AWS_SECRET_ACCESS_KEY = 'test-secret'
    process.env.S3_BUCKET = 'test-bucket'
    process.env.AWS_REGION = 'us-east-1'

    try {
      expect(hasAwsCredentials()).toBe(true)
    } finally {
      for (const key of keys) {
        if (saved[key] !== undefined) {
          process.env[key] = saved[key]
        } else {
          delete process.env[key]
        }
      }
    }
  })

  it('uploadFile uses local storage when forced', async () => {
    await mkdir(tmpRoot, { recursive: true })

    const result = await uploadFile(
      {
        data: Buffer.from('product-image'),
        filename: 'widget.jpg',
        mimeType: 'image/jpeg',
        subdir: 'products',
      },
      { storage: 'local', subdir: 'products' },
    )

    expect(result).toMatchObject({
      storage: 'local',
      url: expect.stringContaining('/uploads/products/'),
    })
    expect(result.filename).toMatch(/widget\.jpg$/)
  })

  it('falls back to local when AWS env vars are missing', async () => {
    const keys = [
      'S3_ACCESS_KEY_ID',
      'S3_SECRET_ACCESS_KEY',
      'S3_BUCKET',
      'S3_REGION',
    ] as const
    const saved: Partial<Record<(typeof keys)[number], string | undefined>> = {}

    for (const key of keys) {
      saved[key] = process.env[key]
      delete process.env[key]
    }

    try {
      const mode = await resolveStorageMode()
      expect(mode).toBe('local')
    } finally {
      for (const key of keys) {
        if (saved[key] !== undefined) {
          process.env[key] = saved[key]
        } else {
          delete process.env[key]
        }
      }
    }
  })
})
