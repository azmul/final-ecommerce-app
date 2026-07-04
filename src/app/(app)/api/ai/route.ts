import { aiJsonResponse } from '@/lib/seo/aiContent'
import { getServerSideURL } from '@/utilities/getURL'

export const dynamic = 'force-static'
export const revalidate = 3600

/** Discovery index for machine-readable AI content endpoints. */
export async function GET() {
  const base = getServerSideURL()

  return aiJsonResponse({
    endpoints: {
      products: `${base}/api/ai/products/{slug}`,
      categories: `${base}/api/ai/categories/{slug}`,
      brands: `${base}/api/ai/brands/{slug}`,
      articles: `${base}/api/ai/articles/{slug}`,
      merchantFeed: `${base}/api/feeds/google-merchant`,
      llmsTxt: `${base}/llms.txt`,
      llmsFullTxt: `${base}/llms-full.txt`,
      sitemap: `${base}/sitemap.xml`,
    },
  })
}
