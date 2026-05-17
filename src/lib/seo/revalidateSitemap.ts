import { revalidatePath } from 'next/cache'

/** Bust cached sitemap and llms-full after catalog or content publishes. */
export function revalidateSitemapAndLlms() {
  revalidatePath('/sitemap.xml')
  revalidatePath('/llms-full.txt')
}
