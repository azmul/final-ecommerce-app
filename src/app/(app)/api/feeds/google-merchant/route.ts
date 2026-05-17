import { buildGoogleMerchantFeedItems, merchantFeedToXml } from '@/lib/seo/merchantFeed'

export const dynamic = 'force-dynamic'

export async function GET() {
  const items = await buildGoogleMerchantFeedItems()
  const xml = merchantFeedToXml(items)

  return new Response(xml, {
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      'Content-Type': 'application/xml; charset=utf-8',
    },
  })
}
