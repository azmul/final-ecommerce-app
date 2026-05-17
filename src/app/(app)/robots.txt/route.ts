import { buildRobotsTxt } from '@/lib/seo/buildRobotsTxt'

export const revalidate = 3600

/** Serves `/robots.txt` as plain text (explicit route for reliable browser access). */
export async function GET() {
  return new Response(buildRobotsTxt(), {
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}
