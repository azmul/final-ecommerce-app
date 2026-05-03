const YOUTUBE_ID_RE = /^[a-zA-Z0-9_-]{11}$/

/**
 * Returns the canonical 11-character id for common YouTube URL shapes, or null.
 */
export function parseYoutubeVideoId(input: string | null | undefined): string | null {
  const raw = input?.trim()
  if (!raw) return null
  if (YOUTUBE_ID_RE.test(raw)) return raw

  try {
    const normalized = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
    const url = new URL(normalized)
    const host = url.hostname.replace(/^www\./i, '').toLowerCase()

    const vQuery = url.searchParams.get('v')
    if (vQuery && YOUTUBE_ID_RE.test(vQuery)) return vQuery

    if (host === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0]
      return id && YOUTUBE_ID_RE.test(id) ? id : null
    }

    if (
      host === 'youtube.com' ||
      host === 'm.youtube.com' ||
      host === 'music.youtube.com' ||
      host === 'youtube-nocookie.com'
    ) {
      const parts = url.pathname.split('/').filter(Boolean)
      for (const marker of ['shorts', 'embed', 'live', 'watch']) {
        const i = parts.indexOf(marker)
        if (i !== -1 && parts[i + 1] && YOUTUBE_ID_RE.test(parts[i + 1])) return parts[i + 1]
      }
      if (parts.length === 1 && YOUTUBE_ID_RE.test(parts[0])) return parts[0]
    }

    return null
  } catch {
    return null
  }
}

export function youtubeEmbedSrc(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}`
}

/** Stable JPG used for cards / OG fallback (maxres sometimes 404s). */
export function youtubeThumbnailSrc(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
}
