import { isMetaDebugEnabled } from '@/lib/analytics/meta/config'

export function logMetaDebug(scope: string, message: string, data?: Record<string, unknown>): void {
  if (!isMetaDebugEnabled()) return

  if (data) {
    console.info(`[meta:${scope}] ${message}`, data)
    return
  }

  console.info(`[meta:${scope}] ${message}`)
}
