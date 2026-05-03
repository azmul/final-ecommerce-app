import type { Media } from '@/payload-types'

export function brandLogoDisplayDimensions(
  media: Media,
  maxHeightPx: number,
  maxWidthPx: number,
) {
  const wFallback = maxWidthPx
  const hFallback = maxHeightPx
  const w =
    typeof media.width === 'number' && media.width > 0 ? media.width : wFallback
  const h =
    typeof media.height === 'number' && media.height > 0 ? media.height : hFallback
  const ratio = w / h
  let height = Math.min(h, maxHeightPx)
  let width = height * ratio
  if (width > maxWidthPx) {
    width = maxWidthPx
    height = width / ratio
  }

  return {
    height: Math.max(1, Math.round(height)),
    width: Math.max(1, Math.round(width)),
  }
}
