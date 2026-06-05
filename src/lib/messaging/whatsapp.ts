import { isSmsConfigured, sendSms, type SmsResult } from '@/lib/messaging/sms'

export function isWhatsAppConfigured(): boolean {
  return Boolean(isSmsConfigured() && process.env.TWILIO_WHATSAPP_FROM)
}

export async function sendWhatsApp(args: { body: string; to: string }): Promise<SmsResult> {
  if (!isWhatsAppConfigured()) {
    return { ok: false, error: 'WhatsApp is not configured.' }
  }

  const sid = process.env.TWILIO_ACCOUNT_SID!
  const token = process.env.TWILIO_AUTH_TOKEN!
  const from = process.env.TWILIO_WHATSAPP_FROM!

  const digits = args.to.replace(/\D/g, '')
  const to =
    digits.startsWith('880') ? `whatsapp:+${digits}`
    : digits.startsWith('01') ? `whatsapp:+88${digits}`
    : `whatsapp:+${digits}`

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
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    return { ok: false, error: text || `WhatsApp failed (${response.status}).` }
  }

  return { ok: true }
}
