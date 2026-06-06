import type { Order } from '@/payload-types'
import { escapeHtml } from '@/utilities/escapeHtml'
import { getServerSideURL } from '@/utilities/getURL'

type OrderEmailOptions = {
  accessToken?: string | null
  heading: string
  intro: string
}

export function renderOrderEmailHtml(order: Order, options: OrderEmailOptions): string {
  const serverURL = getServerSideURL()
  const orderId = order.id
  const query = options.accessToken ? `?accessToken=${encodeURIComponent(options.accessToken)}` : ''
  const orderURL = `${serverURL}/orders/${orderId}${query}`

  const amount =
    typeof order.amount === 'number' && Number.isFinite(order.amount) ?
      `৳${escapeHtml(order.amount.toLocaleString('en-BD'))}`
    : ''

  const items = Array.isArray(order.items) ? order.items : []
  const itemRows = items
    .map((item) => {
      if (!item || typeof item !== 'object') return ''
      const record = item as Record<string, unknown>
      const qty = typeof record.quantity === 'number' ? record.quantity : 1
      const product = record.product
      const rawTitle =
        product && typeof product === 'object' && 'title' in product ?
          String((product as { title?: string }).title ?? 'Item')
        : 'Item'
      const title = escapeHtml(rawTitle)
      return `<li>${title} × ${qty}</li>`
    })
    .filter(Boolean)
    .join('')

  return `
    <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; color: #111;">
      <h1 style="font-size: 1.25rem; margin-bottom: 0.5rem;">${escapeHtml(options.heading)}</h1>
      <p style="margin: 0 0 1rem; line-height: 1.5;">${escapeHtml(options.intro)}</p>
      <p style="margin: 0 0 0.5rem;"><strong>Order #${orderId}</strong>${amount ? ` · ${amount}` : ''}</p>
      ${itemRows ? `<ul style="padding-left: 1.25rem; margin: 0 0 1rem;">${itemRows}</ul>` : ''}
      <p style="margin: 1.5rem 0 0;">
        <a href="${orderURL}" style="display: inline-block; background: #111; color: #fff; padding: 0.65rem 1.25rem; text-decoration: none; border-radius: 6px;">
          View order
        </a>
      </p>
      <p style="margin: 1rem 0 0; font-size: 0.875rem; color: #555;">Or copy this link: ${orderURL}</p>
    </div>
  `
}

function isSyntheticPhoneLoginEmail(email: string): boolean {
  return /^phone\.\d{10,15}@example\.com$/i.test(email.trim())
}

export function resolveOrderRecipientEmail(order: Order): string | null {
  if (typeof order.customerEmail === 'string' && order.customerEmail.trim()) {
    const trimmed = order.customerEmail.trim()
    if (!isSyntheticPhoneLoginEmail(trimmed)) {
      return trimmed
    }
  }
  const customer = order.customer
  if (customer && typeof customer === 'object' && typeof customer.email === 'string') {
    return customer.email.trim()
  }
  return null
}
