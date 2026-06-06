import { mergeWhere } from '@/lib/admin/buildDateRangeWhere'
import { generateAbandonedCartEmail } from '@/lib/ai/generateAbandonedCartEmail'
import { escapeHtml } from '@/utilities/escapeHtml'
import configPromise from '@payload-config'
import { getServerSideURL } from '@/utilities/getURL'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const ABANDONED_HOURS = 24
const MAX_CARTS_PER_RUN = 20

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return jsonError('CRON_SECRET is not configured.', 503)
  }

  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${secret}`) {
    return jsonError('Unauthorized.', 401)
  }

  const payload = await getPayload({ config: configPromise })
  const cutoff = new Date(Date.now() - ABANDONED_HOURS * 60 * 60 * 1000).toISOString()
  const siteName = process.env.SITE_NAME || process.env.COMPANY_NAME || 'Store'
  const serverURL = getServerSideURL()

  const stale = await payload.find({
    collection: 'carts',
    depth: 0,
    limit: MAX_CARTS_PER_RUN,
    overrideAccess: true,
    pagination: false,
    select: {
      id: true,
      items: true,
      customer: true,
      customerEmail: true,
      subtotal: true,
      updatedAt: true,
      abandonedCartEmailSentAt: true,
      currency: true,
    },
    sort: '-updatedAt',
    where: mergeWhere(
      { updatedAt: { less_than: cutoff } },
      { purchasedAt: { equals: null } },
      { subtotal: { greater_than: 0 } },
      {
        or: [{ abandonedCartEmailSentAt: { equals: null } }, { abandonedCartEmailSentAt: { exists: false } }],
      },
    ),
  })

  const results: { cartId: number; emailed?: boolean; skipped?: string }[] = []

  for (const cart of stale.docs) {
    const cartRow = cart as typeof cart & {
      customerEmail?: string | null
      abandonedCartEmailSentAt?: string | null
    }
    const cartId = cartRow.id
    const items = Array.isArray(cartRow.items) ? cartRow.items : []
    if (!items.length) {
      results.push({ cartId, skipped: 'empty' })
      continue
    }

    const email =
      typeof cartRow.customerEmail === 'string' && cartRow.customerEmail.trim() ?
        cartRow.customerEmail.trim()
      : cartRow.customer && typeof cartRow.customer === 'object' && 'email' in cartRow.customer ?
        String((cartRow.customer as { email?: string }).email ?? '').trim()
      : ''

    if (!email) {
      results.push({ cartId, skipped: 'no_email' })
      continue
    }

    const customerId =
      typeof cartRow.customer === 'object' && cartRow.customer && 'id' in cartRow.customer ?
        (cartRow.customer as { id: number }).id
      : typeof cartRow.customer === 'number' ?
        cartRow.customer
      : null

    if (customerId == null) {
      results.push({ cartId, skipped: 'guest_cart' })
      continue
    }

    const prefs = await payload.find({
      collection: 'notification-preferences',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      where: {
        user: { equals: customerId },
      },
    })

    const marketingOptIn =
      prefs.docs[0] && typeof prefs.docs[0] === 'object' ?
        (prefs.docs[0] as { marketingOptIn?: boolean }).marketingOptIn === true
      : false

    if (!marketingOptIn) {
      results.push({ cartId, skipped: 'marketing_opt_out' })
      continue
    }

    const itemTitles = items
      .map((item) => {
        if (!item || typeof item !== 'object') return ''
        const product = (item as { product?: { title?: string } | number }).product
        return product && typeof product === 'object' ? (product.title ?? 'Item') : 'Item'
      })
      .filter(Boolean)

    const itemLines = itemTitles
      .map((title) => `<li>${escapeHtml(title)}</li>`)
      .join('')

    const checkoutURL = `${serverURL}/checkout`
    const safeSiteName = escapeHtml(siteName)

    const customerName =
      cartRow.customer && typeof cartRow.customer === 'object' && 'name' in cartRow.customer ?
        String((cartRow.customer as { name?: string }).name ?? '')
      : ''

    const aiEmail = await generateAbandonedCartEmail({
      customerName,
      itemTitles,
      siteName,
    })

    try {
      await payload.sendEmail({
        to: email,
        subject: aiEmail?.subject ?? `You left items in your cart — ${safeSiteName}`,
        html:
          aiEmail ?
            [
              '<div style="font-family: system-ui, sans-serif; max-width: 560px;">',
              aiEmail.bodyHtml,
              `<p><a href="${checkoutURL}" style="display:inline-block;background:#111;color:#fff;padding:0.65rem 1.25rem;text-decoration:none;border-radius:6px;">Complete checkout</a></p>`,
              '</div>',
            ].join('')
          : [
              '<div style="font-family: system-ui, sans-serif; max-width: 560px;">',
              '<h1>Still thinking it over?</h1>',
              `<p>Items are waiting in your cart at ${safeSiteName}.</p>`,
              `<ul>${itemLines}</ul>`,
              `<p><a href="${checkoutURL}" style="display:inline-block;background:#111;color:#fff;padding:0.65rem 1.25rem;text-decoration:none;border-radius:6px;">Complete checkout</a></p>`,
              '</div>',
            ].join(''),
      })

      await payload.update({
        id: cartId,
        collection: 'carts',
        data: {
          abandonedCartEmailSentAt: new Date().toISOString(),
        } as never,
        overrideAccess: true,
        context: { skipInventoryCartValidation: true },
      })

      results.push({ cartId, emailed: true })
    } catch (err) {
      payload.logger.error({ msg: 'Abandoned cart email failed', err, cartId })
      results.push({ cartId, skipped: 'send_failed' })
    }
  }

  return NextResponse.json({ ok: true, processed: results.length, results })
}
