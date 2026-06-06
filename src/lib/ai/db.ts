import type { Payload } from 'payload'

export type PostgresDrizzle = {
  execute: (query: unknown) => Promise<{ rows?: Record<string, unknown>[] }>
}

export function getPostgresDrizzle(payload: Payload): PostgresDrizzle | null {
  const adapter = payload.db as { drizzle?: PostgresDrizzle }
  return adapter.drizzle ?? null
}
