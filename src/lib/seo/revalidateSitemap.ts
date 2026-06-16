import { revalidatePath } from 'next/cache'

import { pingIndexNow } from '@/lib/seo/indexNow'
import { getServerSideURL } from '@/utilities/getURL'

/** Bust cached sitemap and llms-full after catalog or content publishes. */
export function revalidateSitemapAndLlms() {
  revalidatePath('/sitemap.xml')
  for (const id of ['main', 'products', 'categories', 'brands', 'blog', 'images']) {
    revalidatePath(`/sitemap/${id}.xml`)
  }
  revalidatePath('/llms-full.txt')
}

/** Notify search engines that specific URLs changed (IndexNow). */
export function notifySearchEnginesOfUrls(paths: string[]) {
  const base = getServerSideURL()
  const urls = paths.map((path) => (path.startsWith('http') ? path : `${base}${path}`))
  void pingIndexNow(urls)
}
