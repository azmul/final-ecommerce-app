import configPromise from '@payload-config'
import {
  BLOG_POSTS_PER_PAGE,
  normalizeBlogListingPage,
} from '@/utilities/blogPagination'
import {
  buildPostsListingWhere,
  normalizeBlogSearchQuery,
  normalizePublishedDateRange,
  publishedRangeIsActive,
} from '@/utilities/blogSearch'
import { getPayload } from 'payload'
import { draftMode } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const postSelect = {
  title: true,
  slug: true,
  excerpt: true,
  publishedOn: true,
  featuredImage: true,
  featuredYoutubeUrl: true,
  author: true,
} as const

export async function GET(req: Request) {
  const url = new URL(req.url)
  const q = normalizeBlogSearchQuery(url.searchParams.get('q'))
  const publishedRange = normalizePublishedDateRange(
    url.searchParams.get('publishedFrom') ?? undefined,
    url.searchParams.get('publishedTo') ?? undefined,
  )
  const page = normalizeBlogListingPage(url.searchParams.get('page'))

  const { isEnabled: draft } = await draftMode()
  const payload = await getPayload({ config: configPromise })

  try {
    const results = await payload.find({
      collection: 'posts',
      ...(draft ? { draft: true } : { draft: false }),
      depth: 2,
      limit: BLOG_POSTS_PER_PAGE,
      overrideAccess: draft,
      pagination: true,
      page,
      select: postSelect,
      sort: '-publishedOn',
      where: buildPostsListingWhere({
        draft,
        searchQuery: q,
        publishedRange: publishedRangeIsActive(publishedRange) ? publishedRange : undefined,
      }),
    })

    const totalDocs = typeof results.totalDocs === 'number' ? results.totalDocs : 0
    const totalPages =
      totalDocs <= 0 ? 1
      : typeof results.totalPages === 'number' && results.totalPages > 0 ?
        results.totalPages
      : Math.max(1, Math.ceil(totalDocs / BLOG_POSTS_PER_PAGE))

    return NextResponse.json({
      docs: results.docs,
      hasNextPage: Boolean(results.hasNextPage),
      hasPrevPage: Boolean(results.hasPrevPage),
      page:
        typeof results.page === 'number' && Number.isFinite(results.page) ?
          Math.floor(results.page)
        : page,
      limit: BLOG_POSTS_PER_PAGE,
      totalDocs,
      totalPages,
    })
  } catch (error) {
    console.error('[blog-search]', error)
    return NextResponse.json({ error: 'Search failed', docs: [], totalDocs: 0 }, { status: 500 })
  }
}
