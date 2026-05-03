import { BlogPagination } from '@/components/Blog/BlogPagination'
import type { Metadata } from 'next'
import type { Media, Post, User } from '@/payload-types'

import { BlogFeaturedThumbnail } from '@/components/Blog/BlogFeaturedThumbnail'
import { BlogFilters } from '@/components/Blog/BlogFilters.client'
import configPromise from '@payload-config'
import { format } from 'date-fns'
import { getPayload } from 'payload'
import { draftMode } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import React, { Suspense } from 'react'

import { cmsPageGutterClassName } from '@/utilities/cmsLayout'
import {
  BLOG_POSTS_PER_PAGE,
  buildBlogPageHref,
  normalizeBlogListingPage,
  type BlogListSearchParams,
} from '@/utilities/blogPagination'
import {
  buildPostsListingWhere,
  formatBlogUtcDateLabel,
  normalizeBlogSearchQuery,
  normalizePublishedDateRange,
  publishedRangeIsActive,
  searchParamToString,
  type NormalizedPublishedRange,
} from '@/utilities/blogSearch'
import { cn } from '@/utilities/cn'
import { parseYoutubeVideoId } from '@/utilities/youtube'

type SearchParams = BlogListSearchParams

type PageProps = {
  searchParams: Promise<SearchParams>
}

function buildBlogIntroLine(args: { q: string; range: NormalizedPublishedRange }) {
  const { q, range } = args
  const hasQ = Boolean(q)
  const hasDates = publishedRangeIsActive(range)

  const parts: string[] = []

  if (hasQ) {
    parts.push(`Results for “${q}”`)
  }

  if (hasDates) {
    const { from, to } = range
    if (from && to) {
      parts.push(
        `Published ${formatBlogUtcDateLabel(from)} – ${formatBlogUtcDateLabel(to)}`,
      )
    } else if (from) {
      parts.push(`Published on or after ${formatBlogUtcDateLabel(from)}`)
    } else if (to) {
      parts.push(`Published on or before ${formatBlogUtcDateLabel(to)}`)
    }
    parts[parts.length - 1] = `${parts[parts.length - 1]} · dates in UTC`
  }

  if (parts.length === 0) return 'Articles and updates from our team.'
  return parts.join(' · ')
}

function emptyBlogListMessage(hasSearch: boolean, dateFilterActive: boolean): string {
  if (!hasSearch && !dateFilterActive) return 'No published posts yet — check back soon.'
  if (hasSearch && dateFilterActive) return 'No articles match your search and date range.'
  if (hasSearch) return 'No articles match your search.'
  return 'No articles fall in this date range.'
}

const queryPosts = async (opts: {
  searchRaw?: string
  publishedFromRaw?: string
  publishedToRaw?: string
  page: number
}) => {
  const { searchRaw, publishedFromRaw, publishedToRaw, page } = opts
  const { isEnabled: draft } = await draftMode()
  const payload = await getPayload({ config: configPromise })
  const q = normalizeBlogSearchQuery(searchRaw)
  const publishedRange = normalizePublishedDateRange(publishedFromRaw, publishedToRaw)

  return payload.find({
    collection: 'posts',
    ...(draft ? { draft: true } : { draft: false }),
    depth: 2,
    limit: BLOG_POSTS_PER_PAGE,
    overrideAccess: draft,
    page,
    pagination: true,
    select: {
      title: true,
      slug: true,
      excerpt: true,
      publishedOn: true,
      featuredImage: true,
      featuredYoutubeUrl: true,
      author: true,
    },
    sort: '-publishedOn',
    where: buildPostsListingWhere({
      draft,
      searchQuery: q,
      publishedRange: publishedRangeIsActive(publishedRange) ? publishedRange : undefined,
    }),
  })
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const resolved = await searchParams
  const rawQ = searchParamToString(resolved.q)
  const q = normalizeBlogSearchQuery(rawQ)
  const publishedFromRaw = searchParamToString(resolved.publishedFrom)
  const publishedToRaw = searchParamToString(resolved.publishedTo)
  const range = normalizePublishedDateRange(publishedFromRaw, publishedToRaw)
  const requestedPage = normalizeBlogListingPage(resolved.page)

  const base: Metadata = {
    title: 'Blog',
    description: 'Articles and updates from our team.',
    openGraph: {
      title: 'Blog',
    },
  }

  const pageSuffix = requestedPage > 1 ? ` · Page ${requestedPage}` : ''

  if (!q && !publishedRangeIsActive(range) && requestedPage <= 1) return base

  if (!q && !publishedRangeIsActive(range)) {
    return {
      ...base,
      title: `Blog${pageSuffix}`,
      openGraph: {
        title: `Blog${pageSuffix}`,
      },
    }
  }

  const fragments: string[] = []
  if (q) {
    fragments.push(q.length > 40 ? `${q.slice(0, 40)}…` : q)
  }
  if (publishedRangeIsActive(range)) {
    const { from, to } = range
    if (from && to) {
      fragments.push(`${formatBlogUtcDateLabel(from)}–${formatBlogUtcDateLabel(to)}`)
    } else if (from) {
      fragments.push(`from ${formatBlogUtcDateLabel(from)}`)
    } else if (to) {
      fragments.push(`to ${formatBlogUtcDateLabel(to)}`)
    }
  }

  const summary = fragments.join(', ')

  return {
    ...base,
    title: `Blog · ${summary}${pageSuffix}`,
    description:
      q ? `Articles matching “${summary}”.`
      : `Blog posts filtered by date (${summary}).`,
    openGraph: {
      title: `Blog · ${summary}${pageSuffix}`,
    },
  }
}

export default async function BlogIndexPage({ searchParams }: PageProps) {
  const resolved = await searchParams
  const rawQ = searchParamToString(resolved.q)
  const q = normalizeBlogSearchQuery(rawQ)
  const publishedFromRaw = searchParamToString(resolved.publishedFrom)
  const publishedToRaw = searchParamToString(resolved.publishedTo)
  const publishedRange = normalizePublishedDateRange(publishedFromRaw, publishedToRaw)

  const requestedPage = normalizeBlogListingPage(resolved.page)

  const results = await queryPosts({
    searchRaw: rawQ,
    publishedFromRaw,
    publishedToRaw,
    page: requestedPage,
  })
  const posts = results.docs as Post[]

  const totalDocs = typeof results.totalDocs === 'number' ? results.totalDocs : 0
  const totalPages =
    totalDocs <= 0 ? 1
    : typeof results.totalPages === 'number' && results.totalPages > 0 ?
      results.totalPages
    : Math.max(1, Math.ceil(totalDocs / BLOG_POSTS_PER_PAGE))

  if (totalDocs > 0 && requestedPage > totalPages) {
    redirect(buildBlogPageHref('/blog', resolved, totalPages))
  }

  const displayedPage =
    totalDocs <= 0 ? 1 : Math.min(Math.max(1, requestedPage), totalPages)

  return (
    <article className="pt-8 pb-24">
      <header className={cn(cmsPageGutterClassName, 'mb-6')}>
        <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-3 sm:gap-y-1">
          <h1 className="shrink-0 text-3xl font-semibold tracking-tight">Blog</h1>
          <p className="min-w-0 text-sm text-muted-foreground sm:border-l sm:border-border/60 sm:pl-3 sm:text-base">
            {buildBlogIntroLine({ q, range: publishedRange })}
          </p>
        </div>
        <div className="mt-4 max-w-4xl">
          <Suspense fallback={<div aria-hidden className="h-11 max-w-4xl animate-pulse rounded-lg bg-muted" />}>
            <BlogFilters />
          </Suspense>
        </div>
      </header>

      {posts.length === 0 ?
        <div className={cn(cmsPageGutterClassName, 'text-muted-foreground')}>
          {emptyBlogListMessage(Boolean(q), publishedRangeIsActive(publishedRange))}
        </div>
      : <>
          <div
            className={cn(
              cmsPageGutterClassName,
              'grid gap-x-10 gap-y-14 sm:grid-cols-2 lg:grid-cols-3',
            )}
          >
            {posts.map((post) => {
              const image =
                typeof post.featuredImage === 'object' && post.featuredImage !== null ?
                  (post.featuredImage as Media)
                : undefined
              const ytId = parseYoutubeVideoId(post.featuredYoutubeUrl)
              const author =
                typeof post.author === 'object' && post.author !== null ? (post.author as User) : null

              const showFeatured = Boolean(ytId || image)

              return (
                <Link
                  className="group flex flex-col border-t border-border pt-8 transition-colors hover:border-foreground"
                  href={`/blog/${post.slug}`}
                  key={post.id}
                >
                  <div className="relative mb-5 aspect-[16/10] w-full overflow-hidden rounded-md bg-muted">
                    {showFeatured ?
                      <BlogFeaturedThumbnail
                        ariaLabelTitle={post.title ?? 'Blog post'}
                        featuredImage={image}
                        featuredYoutubeUrl={post.featuredYoutubeUrl}
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    : null}
                  </div>

                  <time
                    className="text-xs text-muted-foreground"
                    dateTime={post.publishedOn ?? undefined}
                  >
                    {post.publishedOn ?
                      format(new Date(post.publishedOn), 'MMMM d, yyyy')
                    : 'Draft'}
                  </time>

                  <h2 className="mt-2 text-xl font-semibold tracking-tight group-hover:underline decoration-foreground/40 underline-offset-4">
                    {post.title}
                  </h2>

                  {post.excerpt ?
                    <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{post.excerpt}</p>
                  : null}

                  {author?.name ?
                    <p className="mt-4 text-xs text-muted-foreground">By {author.name}</p>
                  : null}
                </Link>
              )
            })}
          </div>

          <div className={cmsPageGutterClassName}>
            <BlogPagination
              currentPage={displayedPage}
              pathname="/blog"
              resolvedSearch={resolved}
              totalPages={totalPages}
            />
          </div>
        </>}
    </article>
  )
}
