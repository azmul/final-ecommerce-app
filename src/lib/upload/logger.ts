type LogMeta = Record<string, unknown>

function formatMeta(meta?: LogMeta): string {
  if (!meta || Object.keys(meta).length === 0) return ''
  try {
    return ` ${JSON.stringify(meta)}`
  } catch {
    return ''
  }
}

export const uploadLogger = {
  info(message: string, meta?: LogMeta): void {
    console.info(`[upload] ${message}${formatMeta(meta)}`)
  },
  warn(message: string, meta?: LogMeta): void {
    console.warn(`[upload] ${message}${formatMeta(meta)}`)
  },
  error(message: string, meta?: LogMeta): void {
    console.error(`[upload] ${message}${formatMeta(meta)}`)
  },
}
