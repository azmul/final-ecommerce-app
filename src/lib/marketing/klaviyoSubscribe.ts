/**
 * Subscribe an email to a Klaviyo list via Profile Subscription Bulk Create Job API.
 * @see https://developers.klaviyo.com/en/reference/profile_subscription_bulk_create_job_create
 */

const KLAVIYO_REVISION = '2024-10-15'

export async function subscribeEmailToKlaviyoList(args: {
  apiKey: string
  listId: string
  email: string
  source?: string
}): Promise<{ ok: boolean; status: number }> {
  const { apiKey, listId, email, source = 'Payload form submission' } = args
  const trimmed = email.trim().toLowerCase()
  if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { ok: false, status: 400 }
  }

  const body = {
    data: {
      type: 'profile-subscription-bulk-create-job',
      attributes: {
        custom_source: source,
        profiles: {
          data: [
            {
              type: 'profile',
              attributes: {
                email: trimmed,
                subscriptions: {
                  email: {
                    marketing: {
                      consent: 'SUBSCRIBED',
                    },
                  },
                },
              },
            },
          ],
        },
      },
      relationships: {
        list: {
          data: {
            type: 'list',
            id: listId,
          },
        },
      },
    },
  }

  const res = await fetch('https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs', {
    method: 'POST',
    headers: {
      Authorization: `Klaviyo-API-Key ${apiKey}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      revision: KLAVIYO_REVISION,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    console.warn('[klaviyo] Subscribe failed', res.status, text.slice(0, 300))
  }

  return { ok: res.ok, status: res.status }
}

export function extractEmailFromSubmissionData(
  rows: { field?: string | null; value?: unknown }[] | null | undefined,
): string | null {
  if (!rows?.length) return null

  for (const row of rows) {
    const name = typeof row.field === 'string' ? row.field.toLowerCase() : ''
    const raw = row.value
    const str =
      typeof raw === 'string'
        ? raw
        : raw && typeof raw === 'object' && 'email' in raw && typeof (raw as { email?: unknown }).email === 'string'
          ? (raw as { email: string }).email
          : ''

    if (!str || typeof str !== 'string') continue

    const trimmed = str.trim()
    if (name === 'email' || name.endsWith('_email') || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return trimmed
    }
  }

  return null
}
