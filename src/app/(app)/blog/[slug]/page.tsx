import type { Metadata } from 'next'
import type { Media, Post, User } from '@/payload-types'

import { BlogComments } from '@/components/BlogComments'
import type { LoggedBlogCommentViewer } from '@/components/BlogComments/types'
import { RichText } from '@/components/RichText'
import { Media as MediaCmp } from '@/components/Media'
import configPromise from '@payload-config'
import { format } from 'date-fns'
import { getPayload } from 'payload'
import { draftMode, headers as getHeaders } from 'next/headers'
import { ChevronLeftIcon } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BlogPostGeoSection } from '@/components/seo/BlogPostGeoSection'
import { JsonLd } from '@/lib/seo/JsonLd'
import { buildBlogJsonLd } from '@/lib/seo/buildBlogJsonLd'
import { buildBreadcrumbJsonLd } from '@/lib/seo/buildBreadcrumbJsonLd'
import { getPostSeoContent } from '@/lib/seo/resolveGeoContent'
import React from 'react'

import { AuthorBio } from '@/components/Blog/AuthorBio'
import { BlogBreadcrumb } from '@/components/Blog/BlogBreadcrumb'
import TableOfContents, { extractHeadings } from '@/components/Blog/TableOfContents'
import { RelatedPosts, normalizedRelatedPosts } from '@/components/Blog/RelatedPosts'
import { SocialShareRow } from '@/components/SocialShare/SocialShareRow'
import { cmsPageGutterClassName } from '@/utilities/cmsLayout'
import { cn } from '@/utilities/cn'
import { generateMeta } from '@/utilities/generateMeta'
import { getServerSideURL, toAbsoluteUrl } from '@/utilities/getURL'
import { parseYoutubeVideoId, youtubeEmbedSrc } from '@/utilities/youtube'

type Args = {
  params: Promise<{
    slug: string
  }>
}

/**
 * Best-effort word count from a Lexical/Payload rich-text root. Used to derive
 * an approximate "X min read" badge in the hero. Returns 0 on malformed input.
 */
function countWordsInRichText(content: unknown): number {
  if (!content || typeof content !== 'object') return 0
  const root =
    (content as { root?: { children?: unknown } }).root ??
    (content as { children?: unknown })
  if (!root || typeof root !== 'object') return 0
  const children = (root as { children?: unknown }).children
  if (!Array.isArray(children)) return 0

  const parts: string[] = []
  const walk = (node: unknown): void => {
    if (!node || typeof node !== 'object') return
    const n = node as { text?: unknown; children?: unknown }
    if (typeof n.text === 'string') parts.push(n.text)
    if (Array.isArray(n.children)) n.children.forEach(walk)
  }
  children.forEach(walk)
  return parts.join(' ').split(/\s+/).filter(Boolean).length
}

function computeReadingMinutes(content: unknown): number {
  const words = countWordsInRichText(content)
  if (words === 0) return 0
  return Math.max(1, Math.ceil(words / 200))
}

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise })
  const posts = await payload.find({
    collection: 'posts',
    draft: false,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    select: {
      slug: true,
    },
    where: {
      _status: {
        equals: 'published',
      },
    },
  })

  return posts.docs.map(({ slug }) => ({ slug }))
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params

  const post = await queryPostBySlug({ slug })

  if (!post) {
    return { title: 'Not found' }
  }

  const canIndex = post._status === 'published'

  const seo = getPostSeoContent(post)
  const aiSummary =
    seo?.aiSummary?.trim() ||
    post.excerpt?.trim() ||
    post.meta?.description?.trim() ||
    ''

  const base = await generateMeta({
    doc: post,
    pathname: `/blog/${post.slug}`,
  })

  return {
    ...base,
    ...(aiSummary ? { other: { 'ai-summary': aiSummary } } : {}),
    robots: {
      follow: canIndex ?? false,
      googleBot: {
        follow: canIndex ?? false,
        index: canIndex ?? false,
      },
      index: canIndex ?? false,
    },
  }
}

export default async function BlogPostPage({ params }: Args) {
  const { slug } = await params
  const post = await queryPostBySlug({ slug })

  if (!post) {
    return notFound()
  }

  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers })

  const loggedInViewer: LoggedBlogCommentViewer = user
    ? {
        email: user.email,
        id: user.id,
        name: user.name ?? null,
      }
    : null

  const featuredYoutubeId = parseYoutubeVideoId(post.featuredYoutubeUrl)

  const featured =
    typeof post.featuredImage === 'object' && post.featuredImage !== null ?
      (post.featuredImage as Media)
    : undefined
  const author =
    typeof post.author === 'object' && post.author !== null ? (post.author as User) : null

  const hasRelatedSidebar = normalizedRelatedPosts(post.relatedPosts, post.id).length > 0

  const canonicalUrl = `${getServerSideURL()}/blog/${post.slug}`
  const featuredImageUrl = featured?.url ? toAbsoluteUrl(featured.url) : undefined
  const postSeo = getPostSeoContent(post)

  const headings = extractHeadings(post.content)
  const hasToc = headings.length >= 2
  const readingMinutes = computeReadingMinutes(post.content)

  const siteBase = getServerSideURL()
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: 'Home', item: siteBase },
    { name: 'Blog', item: `${siteBase}/blog` },
    { name: post.title, item: canonicalUrl },
  ])

  const authorSlug = author?.authorProfile?.authorSlug?.trim() || ''

  return (
    <article className="pt-16 pb-24">
      <JsonLd data={buildBlogJsonLd(post, slug)} />
      <JsonLd data={breadcrumbJsonLd} />
      <div className={cmsPageGutterClassName}>
        <Link
          className={cn(
            'inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground',
          )}
          href="/blog"
        >
          <ChevronLeftIcon className="h-4 w-4 shrink-0" aria-hidden />
          All posts
        </Link>

        <BlogBreadcrumb className="mt-6" title={post.title} />

        <header className="mx-auto mt-10 max-w-3xl text-center">
          <time
            className="text-sm text-muted-foreground"
            dateTime={post.publishedOn ?? undefined}
          >
            {post.publishedOn ?
              format(new Date(post.publishedOn), 'MMMM d, yyyy')
            : 'Draft'}
          </time>
          <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight md:text-5xl">
            {post.title}
          </h1>
          {post.excerpt ?
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">{post.excerpt}</p>
          : null}
          {author?.name ?
            <p className="mt-6 text-sm text-muted-foreground">
              By{' '}
              {authorSlug ?
                <Link
                  className="font-medium text-foreground underline-offset-4 transition-colors hover:underline"
                  href={`/author/${authorSlug}`}
                  itemProp="author"
                >
                  {author.name}
                </Link>
              : <span itemProp="author">{author.name}</span>}
              {post.updatedAt ?
                <>
                  {' '}
                  · Updated{' '}
                  <time dateTime={post.updatedAt}>
                    {format(new Date(post.updatedAt), 'MMMM d, yyyy')}
                  </time>
                </>
              : null}
              {readingMinutes > 0 ?
                <>
                  {' '}
                  · <span>{readingMinutes} min read</span>
                </>
              : null}
            </p>
          : readingMinutes > 0 ?
            <p className="mt-6 text-sm text-muted-foreground">{readingMinutes} min read</p>
          : null}

          <SocialShareRow
            className="mt-10 text-center [&>div:last-child]:justify-center"
            imageUrl={featuredImageUrl}
            summary={post.excerpt ?? undefined}
            title={post.title}
            url={canonicalUrl}
          />
        </header>

        {featuredYoutubeId ?
          <div className="mx-auto mt-12 max-w-4xl">
            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted shadow-sm ring-1 ring-border/70 dark:shadow-none">
              <iframe
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute inset-0 h-full w-full border-0"
                referrerPolicy="strict-origin-when-cross-origin"
                src={youtubeEmbedSrc(featuredYoutubeId)}
                title={post.title ?? 'Featured video'}
              />
            </div>
          </div>
        : featured ?
          <div className="mx-auto mt-12 max-w-4xl">
            <figure className="relative aspect-2/1 w-full overflow-hidden rounded-lg bg-muted">
              <MediaCmp
                alt={featured.alt?.trim() ? featured.alt : `${post.title}: featured image`}
                fill
                className="relative h-full w-full"
                imgClassName="object-cover"
                priority
                resource={featured}
                size="(max-width: 1024px) 100vw, 896px"
              />
              {featured.alt ?
                <figcaption className="sr-only">{featured.alt}</figcaption>
              : null}
            </figure>
          </div>
        : null}

        <div className="mx-auto mt-10 max-w-3xl">
          <BlogPostGeoSection contentType={post.contentType} seoContent={postSeo} />
        </div>

        <div
          className={cn(
            'mt-14 flex flex-col gap-14',
            hasRelatedSidebar || hasToc ?
              'lg:grid lg:grid-cols-[minmax(0,1fr)_17.75rem] lg:items-start lg:gap-x-10 lg:gap-y-14 xl:grid-cols-[minmax(0,1fr)_19rem] xl:gap-x-12'
            : undefined,
          )}
        >
          <div
            className={cn(
              'mx-auto w-full max-w-3xl min-w-0',
              (hasRelatedSidebar || hasToc) && 'lg:col-start-1 lg:row-start-1 lg:mx-0',
            )}
          >
            {hasToc ?
              <details className="group mb-6 rounded-md border border-border bg-background/60 lg:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-semibold tracking-tight text-foreground [&::-webkit-details-marker]:hidden">
                  <span>On this page</span>
                  <svg
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-4 pb-4">
                  <TableOfContents items={headings} />
                </div>
              </details>
            : null}

            <RichText data={post.content} enableGutter={false} />

            <AuthorBio user={author} />
          </div>

          {hasToc || hasRelatedSidebar ?
            <aside
              className={cn(
                'min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start',
                hasRelatedSidebar &&
                  'border-t border-border pt-14 lg:border-t-0 lg:border-l lg:border-border lg:pt-0 lg:pl-8 xl:pl-10',
              )}
            >
              {hasToc ?
                <div className="hidden lg:sticky lg:top-24 lg:block">
                  <TableOfContents items={headings} />
                </div>
              : null}
              {hasRelatedSidebar ?
                <div className={cn('lg:sticky lg:top-28', hasToc && 'lg:mt-10')}>
                  <RelatedPosts
                    currentPostId={post.id}
                    layout="sidebar"
                    relatedPosts={post.relatedPosts}
                  />
                </div>
              : null}
            </aside>
          : null}

          <div
            className={cn(
              'mx-auto w-full max-w-3xl min-w-0',
              (hasRelatedSidebar || hasToc) && 'lg:col-start-1 lg:row-start-2 lg:mx-0',
            )}
          >
            <BlogComments
              loggedInViewer={loggedInViewer}
              loginReturnPath={`/blog/${post.slug}`}
              postId={post.id}
            />
          </div>
        </div>
      </div>
    </article>
  )
}

const queryPostBySlug = async ({ slug }: { slug: string }) => {
  const { isEnabled: draft } = await draftMode()
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'posts',
    draft,
    depth: 4,
    limit: 1,
    overrideAccess: draft,
    pagination: false,
    where: {
      and: [
        {
          slug: {
            equals: slug,
          },
        },
        ...(draft ? [] : [{ _status: { equals: 'published' } }]),
      ],
    },
  })

  return (result.docs?.[0] as Post | undefined) ?? null
}
