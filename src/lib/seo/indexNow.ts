import { getServerSideURL } from '@/utilities/getURL'

const INDEXNOW_ENDPOINTS = [
  'https://api.indexnow.org/indexnow',
  'https://www.bing.com/indexnow',
]

type IndexNowPayload = {
  host: string
  key: string
  keyLocation: string
  urlList: string[]
}

function resolveIndexNowConfig() {
  const key = process.env.INDEXNOW_KEY?.trim()
  if (!key) return null

  const base = getServerSideURL()
  let host: string
  try {
    host = new URL(base).host
  } catch {
    return null
  }

  return {
    host,
    key,
    keyLocation: `${base}/${key}.txt`,
  }
}

/** Ping IndexNow after content publishes (Bing, Yandex, etc.). Fire-and-forget. */
export async function pingIndexNow(urls: string[]): Promise<void> {
  const config = resolveIndexNowConfig()
  if (!config || urls.length === 0) return

  const uniqueUrls = [...new Set(urls.map((url) => url.trim()).filter(Boolean))].slice(0, 100)

  const payload: IndexNowPayload = {
    host: config.host,
    key: config.key,
    keyLocation: config.keyLocation,
    urlList: uniqueUrls,
  }

  await Promise.allSettled(
    INDEXNOW_ENDPOINTS.map((endpoint) =>
      fetch(endpoint, {
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        method: 'POST',
      }),
    ),
  )
}

export function getIndexNowKey(): string | null {
  return process.env.INDEXNOW_KEY?.trim() || null
}
