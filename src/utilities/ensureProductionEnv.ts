/** Validates secrets required for safe production operation. Call before `buildConfig`. */
export function ensureProductionEnv(): void {
  if (process.env.NODE_ENV !== 'production') {
    return
  }

  // `next build` runs with NODE_ENV=production but must not require deployment secrets in CI.
  if (process.env.npm_lifecycle_event === 'build') {
    return
  }

  const dbUrl = process.env.DATABASE_URL?.trim()
  if (!dbUrl) {
    throw new Error(
      '[security] DATABASE_URL must be set when NODE_ENV is production. Refusing to start.',
    )
  }

  const secret = process.env.PAYLOAD_SECRET?.trim()
  if (!secret || secret.length < 32) {
    throw new Error(
      '[security] PAYLOAD_SECRET must be set to at least 32 characters when NODE_ENV is production. Refusing to start.',
    )
  }
}
