export type SmsResult = { ok: true } | { ok: false; error: string }

export function isSmsConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_FROM_NUMBER,
  )
}

function normalizeBdPhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('880') && digits.length >= 12) return `+${digits}`
  if (digits.startsWith('01') && digits.length === 11) return `+88${digits}`
  if (digits.length >= 10) return `+${digits}`
  return null
}

export async function sendSms(args: { body: string; to: string }): Promise<SmsResult> {
  if (!isSmsConfigured()) {
    return { ok: false, error: 'SMS is not configured.' }
  }

  const to = normalizeBdPhone(args.to)
  if (!to) {
    return { ok: false, error: 'Invalid phone number.' }
  }

  const sid = process.env.TWILIO_ACCOUNT_SID!
  const token = process.env.TWILIO_AUTH_TOKEN!
  const from = process.env.TWILIO_FROM_NUMBER!

  const body = new URLSearchParams({
    Body: args.body,
    From: from,
    To: to,
  })

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    body,
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    method: 'POST',
    signal: AbortSignal.timeout(15_000),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    return { ok: false, error: text || `SMS failed (${response.status}).` }
  }

  return { ok: true }
}
