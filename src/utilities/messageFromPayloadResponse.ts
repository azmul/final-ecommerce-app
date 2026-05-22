/** Extract a user-facing message from a Payload REST error body. */
export function messageFromPayloadBody(
  body: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (!body || typeof body !== 'object') {
    return fallback
  }

  const record = body as { errors?: { message?: string }[]; message?: string }

  if (Array.isArray(record.errors) && record.errors.length > 0) {
    const messages = record.errors
      .map((error) => (typeof error?.message === 'string' ? error.message.trim() : ''))
      .filter(Boolean)

    if (messages.length > 0) {
      return messages.join(' ')
    }
  }

  if (typeof record.message === 'string' && record.message.trim()) {
    return record.message.trim()
  }

  return fallback
}

/** Read and parse a failed Payload REST response into a user-facing message. */
export async function messageFromPayloadResponse(
  response: Response,
  fallback = 'Something went wrong. Please try again.',
): Promise<string> {
  const body = await response.json().catch(() => null)
  return messageFromPayloadBody(body, fallback)
}
