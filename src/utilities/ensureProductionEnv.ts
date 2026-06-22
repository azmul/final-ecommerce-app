/**
 * Returns the JWT-signing secret, failing closed if it is empty.
 *
 * An empty signing secret makes every session token forgeable (full auth
 * bypass / privilege escalation), so we never substitute `''` — not even in
 * dev/test/preview. `next build` is the only exception: it imports the config
 * to generate types/import-maps and must not require deployment secrets in CI.
 */
export function requirePayloadSecret(): string {
  const secret = process.env.PAYLOAD_SECRET?.trim()
  if (secret) return secret

  if (process.env.npm_lifecycle_event === 'build') {
    return 'build-time-placeholder-not-used-at-runtime'
  }

  throw new Error(
    '[security] PAYLOAD_SECRET must be set. Refusing to start with an empty JWT-signing secret.',
  )
}

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

  // OAuth-derived passwords must use a secret distinct from PAYLOAD_SECRET so a
  // leak of the JWT secret does not also expose every social account's password.
  const oauthSecret = process.env.OAUTH_DERIVATION_SECRET?.trim()
  if (!oauthSecret || oauthSecret.length < 32) {
    throw new Error(
      '[security] OAUTH_DERIVATION_SECRET must be set to at least 32 characters (distinct from PAYLOAD_SECRET) when NODE_ENV is production. Refusing to start.',
    )
  }
  if (oauthSecret === secret) {
    throw new Error(
      '[security] OAUTH_DERIVATION_SECRET must differ from PAYLOAD_SECRET. Refusing to start.',
    )
  }
}
