/**
 * Validates user-uploaded images by *content* (magic bytes), not by the
 * client-supplied `file.type` which is trivially spoofable.
 *
 * SVG is intentionally excluded: it is an XML document that can carry
 * `<script>` and, when served same-origin, executes as stored XSS. Only
 * re-encodable raster formats are accepted.
 */

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
] as const

export type AllowedImageMime = (typeof ALLOWED_IMAGE_MIME_TYPES)[number]

function matches(bytes: Uint8Array, signature: number[], offset = 0): boolean {
  if (bytes.length < offset + signature.length) return false
  for (let i = 0; i < signature.length; i++) {
    if (bytes[offset + i] !== signature[i]) return false
  }
  return true
}

function hasAscii(bytes: Uint8Array, text: string, offset: number): boolean {
  return matches(bytes, Array.from(text, (c) => c.charCodeAt(0)), offset)
}

/** Returns the sniffed MIME type for a known-safe raster image, or null. */
export function sniffImageMime(buffer: Buffer | Uint8Array): AllowedImageMime | null {
  const b = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)

  // JPEG: FF D8 FF
  if (matches(b, [0xff, 0xd8, 0xff])) return 'image/jpeg'
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (matches(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png'
  // GIF: "GIF87a" / "GIF89a"
  if (hasAscii(b, 'GIF8', 0)) return 'image/gif'
  // WEBP: "RIFF"...."WEBP"
  if (hasAscii(b, 'RIFF', 0) && hasAscii(b, 'WEBP', 8)) return 'image/webp'
  // AVIF/HEIF: "ftyp" at offset 4 with an avif/heic brand at offset 8
  if (hasAscii(b, 'ftyp', 4)) {
    const brand = String.fromCharCode(b[8], b[9], b[10], b[11])
    if (['avif', 'avis', 'heic', 'heix', 'mif1', 'msf1'].includes(brand)) return 'image/avif'
  }
  return null
}

export type ImageValidationResult =
  | { ok: true; mime: AllowedImageMime }
  | { ok: false; error: string }

/**
 * Full validation for an uploaded File: declared type allowlist + size cap +
 * magic-byte content check. Returns the trusted (sniffed) mime on success.
 */
export async function validateImageUpload(
  file: File,
  opts: { maxBytes: number },
): Promise<ImageValidationResult & { buffer?: Buffer }> {
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type as AllowedImageMime)) {
    return { ok: false, error: 'Only JPEG, PNG, WebP, AVIF, or GIF images are allowed.' }
  }
  if (file.size > opts.maxBytes) {
    const mb = Math.round(opts.maxBytes / (1024 * 1024))
    return { ok: false, error: `Image must be ${mb} MB or smaller.` }
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const sniffed = sniffImageMime(buffer)
  if (!sniffed) {
    return { ok: false, error: 'File content is not a supported image format.' }
  }

  return { ok: true, mime: sniffed, buffer }
}
