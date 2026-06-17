import type { Media } from '@/payload-types'

export function resolveMediaUrl(media: Media | number | null | undefined): string | null {
  if (!media || typeof media !== 'object') return null
  return typeof media.url === 'string' ? media.url : null
}
