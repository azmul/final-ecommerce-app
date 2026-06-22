import { logSecurityEvent } from '@/monitoring/logSecurityEvent'
import { clientIpFromHeaders } from '@/lib/risk/captureRequestContext'
import configPromise from '@payload-config'
import { createLocalReq, getPayload } from 'payload'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * POST /api/custom/login
 *
 * Wraps Payload's built-in login to capture failed authentication attempts
 * for security event logging. On failure, logs to the security-events
 * collection before returning the error to the client.
 *
 * Request body: { email: string, password: string }
 * Response: Same format as Payload's /api/users/login
 */
export async function POST(request: Request) {
  const payload = await getPayload({ config: configPromise })

  let body: { email?: unknown; password?: unknown } = {}
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json(
      { errors: [{ message: 'Invalid JSON body.' }] },
      { status: 400 },
    )
  }

  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!email || !password) {
    return NextResponse.json(
      { errors: [{ message: 'Email and password are required.' }] },
      { status: 400 },
    )
  }

  const ip = clientIpFromHeaders(request.headers)
  const userAgent = request.headers.get('user-agent') ?? null

  try {
    const req = await createLocalReq({}, payload)

    const result = await payload.login({
      collection: 'users',
      data: { email, password },
      req,
    })

    if (!result.token || !result.user) {
      await logSecurityEvent(payload, {
        eventType: 'failed_login_email',
        ip,
        metadata: { email },
        summary: `Failed login attempt for email: ${email}`,
        userAgent,
      })

      return NextResponse.json(
        { errors: [{ message: 'The email or password provided is incorrect.' }] },
        { status: 401 },
      )
    }

    const usersCollection = payload.collections.users.config
    const { generatePayloadCookie } = await import('payload')

    const cookie = generatePayloadCookie({
      collectionAuthConfig: usersCollection.auth,
      cookiePrefix: payload.config.cookiePrefix,
      token: result.token,
    })

    // Session is carried by the httpOnly cookie below. Do NOT return the raw
    // JWT in the body — that exposes it to any XSS and to logging/observability.
    const response = NextResponse.json({
      user: result.user,
    })

    response.headers.append('Set-Cookie', cookie)

    return response
  } catch (err) {
    await logSecurityEvent(payload, {
      eventType: 'failed_login_email',
      ip,
      metadata: {
        email,
        error: err instanceof Error ? err.message : String(err),
      },
      summary: `Failed login attempt for email: ${email} (exception)`,
      userAgent,
    })

    return NextResponse.json(
      { errors: [{ message: 'The email or password provided is incorrect.' }] },
      { status: 401 },
    )
  }
}
