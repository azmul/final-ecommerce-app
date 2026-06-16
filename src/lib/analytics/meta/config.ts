export type MetaServerConfig = {
  pixelId: string
  accessToken: string
  testEventCode?: string
}

export type MetaClientConfig = {
  pixelId: string
}

export function getMetaClientConfig(): MetaClientConfig | null {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim()
  if (!pixelId) return null
  return { pixelId }
}

export function getMetaServerConfig(): MetaServerConfig | null {
  const pixelId =
    process.env.META_PIXEL_ID?.trim() || process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim()
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN?.trim()
  if (!pixelId || !accessToken) return null

  const testEventCode = process.env.META_TEST_EVENT_CODE?.trim()
  return {
    accessToken,
    pixelId,
    ...(testEventCode ? { testEventCode } : {}),
  }
}

export function isMetaDebugEnabled(): boolean {
  return process.env.NODE_ENV === 'development' || process.env.META_DEBUG === '1'
}
