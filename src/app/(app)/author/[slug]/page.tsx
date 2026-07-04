import type { Metadata } from 'next'
import { ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

import type { Media, Post, User } from '@/payload-types'
import { RichText } from '@/components/RichText'
import { BlogBreadcrumb } from '@/components/Blog/BlogBreadcrumb'
import { JsonLd } from '@/lib/seo/JsonLd'
import { buildBreadcrumbJsonLd } from '@/lib/seo/buildBreadcrumbJsonLd'
import { cmsPageGutterClassName } from '@/utilities/cmsLayout'
import { cn } from '@/utilities/cn'
import { getServerSideURL, toAbsoluteUrl } from '@/utilities/getURL'

export const revalidate = 3600

type Args = {
  params: Promise<{
    slug: string
  }>
}

const SITE_NAME = process.env.SITE_NAME || process.env.COMPANY_NAME || 'Ghorer Bazar'

/**
 * Author initials for the photo fallback (max 2 chars).
 */
function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return ((parts[0]![0] ?? '') + (parts[parts.length - 1]![0] ?? '')).toUpperCase()
}

/**
 * Best-effort platform label from a sameAs URL.
 */
function platformLabelFromUrl(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '').toLowerCase()
    if (host.includes('linkedin.com')) return 'LinkedIn'
    if (host.includes('twitter.com') || host === 'x.com' || host.endsWith('.x.com')) {
      return 'Twitter/X'
    }
    if (host.includes('facebook.com')) return 'Facebook'
    if (host.includes('instagram.com')) return 'Instagram'
    if (host.includes('github.com')) return 'GitHub'
    if (host.includes('orcid.org')) return 'ORCID'
    if (host.includes('youtube.com') || host === 'youtu.be') return 'YouTube'
    if (host.includes('threads.net')) return 'Threads'
    if (host.includes('mastodon')) return 'Mastodon'
    if (host.includes('medium.com')) return 'Medium'
    if (host.includes('bsky.app')) return 'Bluesky'
    if (host.includes('tiktok.com')) return 'TikTok'
    return host
  } catch {
    return url
  }
}

/**
 * Walks a Lexical/rich-text tree and joins all text nodes into a single string.
 * Forgiving: returns '' on any malformed input.
 */
function richTextToPlainText(content: unknown): string {
  if (!content || typeof content !== 'object') return ''
  const root = (content as { root?: { children?: unknown } }).root
  if (!root || typeof root !== 'object') return ''
  const children = (root as { children?: unknown }).children
  if (!Array.isArray(children)) return ''

  const parts: string[] = []
  const walk = (node: unknown): void => {
    if (!node || typeof node !== 'object') return
    const n = node as { text?: unknown; children?: unknown }
    if (typeof n.text === 'string') parts.push(n.text)
    if (Array.isArray(n.children)) n.children.forEach(walk)
  }
  try {
    children.forEach(walk)
  } catch {
    return ''
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim()
}

function truncate(text: string, max = 220): string {
  if (text.length <= max) return text
  return text.slice(0, max - 1).trimEnd() + '…'
}

const queryUserByAuthorSlug = async (slug: string): Promise<User | null> => {
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'users',
    depth: 2,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      'authorProfile.authorSlug': {
        equals: slug,
      },
    },
  })

  return (result.docs?.[0] as User | undefined) ?? null
}

const queryPostsByAuthor = async (authorId: number): Promise<Post[]> => {
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'posts',
    depth: 1,
    limit: 50,
    overrideAccess: false,
    pagination: false,
    sort: '-publishedOn',
    where: {
      and: [
        {
          author: {
            equals: authorId,
          },
        },
        {
          _status: {
            equals: 'published',
          },
        },
      ],
    },
  })

  return (result.docs as Post[]) ?? []
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const user = await queryUserByAuthorSlug(slug)

  if (!user) {
    return { title: 'Author not found' }
  }

  const name = user.name?.trim() || 'Author'
  const bioPlain = richTextToPlainText(user.authorProfile?.bio)
  const jobTitle = user.authorProfile?.jobTitle?.trim() ?? ''
  const fallbackDescription = jobTitle
    ? `${name} - ${jobTitle} at ${SITE_NAME}.`
    : `Articles and guides written by ${name} at ${SITE_NAME}.`
  const description = truncate(bioPlain || fallbackDescription)

  const canonicalUrl = `${getServerSideURL()}/author/${slug}`
  const title = `${name} - Author at ${SITE_NAME}`

  const photoMedia: Media | null =
    typeof user.authorProfile?.photo === 'object' && user.authorProfile?.photo !== null
      ? (user.authorProfile.photo as Media)
      : null
  const photoUrl = photoMedia?.url ? toAbsoluteUrl(photoMedia.url) : undefined

  return {
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'en-BD': canonicalUrl,
        'x-default': canonicalUrl,
      },
    },
    description,
    openGraph: {
      description,
      images: photoUrl ? [{ url: photoUrl }] : undefined,
      title,
      type: 'profile',
      url: canonicalUrl,
    },
    robots: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
      googleBot: {
        index: true,
        follow: true,
        'max-snippet': -1,
        'max-image-preview': 'large',
        'max-video-preview': -1,
      },
    },
    title,
    twitter: {
      card: 'summary_large_image',
      description,
      images: photoUrl ? [photoUrl] : undefined,
      title,
    },
  }
}

export default async function AuthorPage({ params }: Args) {
  const { slug } = await params
  const user = await queryUserByAuthorSlug(slug)

  if (!user) {
    return notFound()
  }

  const name = user.name?.trim() || 'Author'
  const profile = user.authorProfile
  const bio = profile?.bio ?? null
  const bioPlain = richTextToPlainText(bio)
  const jobTitle = profile?.jobTitle?.trim() ?? ''
  const credentials = profile?.credentials?.trim() ?? ''

  const expertise = (profile?.expertise ?? []).filter(
    (entry): entry is { topic: string; id?: string | null } =>
      Boolean(entry && typeof entry.topic === 'string' && entry.topic.trim()),
  )
  const sameAs = (profile?.sameAs ?? []).filter(
    (entry): entry is { url: string; id?: string | null } =>
      Boolean(entry && typeof entry.url === 'string' && entry.url.trim()),
  )

  const photoMedia: Media | null =
    typeof profile?.photo === 'object' && profile?.photo !== null
      ? (profile.photo as Media)
      : null
  const photoUrl = photoMedia?.url ?? null
  const photoAbsoluteUrl = photoMedia?.url ? toAbsoluteUrl(photoMedia.url) : undefined
  const photoAlt = photoMedia?.alt?.trim() || `Portrait of ${name}`

  const posts = await queryPostsByAuthor(user.id)

  const siteBase = getServerSideURL()
  const canonicalUrl = `${siteBase}/author/${slug}`
  const authorsIndexUrl = `${siteBase}/blog`

  // BreadcrumbList: Home > Authors > {name}
  const breadcrumbJsonLd = buildBreadcrumbJsonLd([
    { name: 'Home', item: siteBase },
    { name: 'Authors', item: authorsIndexUrl },
    { name, item: canonicalUrl },
  ])

  // Person (rich)
  const personJsonLd: Record<string, unknown> = {
    '@type': 'Person',
    '@id': `${canonicalUrl}#person`,
    name,
    url: canonicalUrl,
    ...(jobTitle ? { jobTitle } : {}),
    ...(bioPlain ? { description: truncate(bioPlain, 500) } : {}),
    ...(photoAbsoluteUrl ? { image: photoAbsoluteUrl } : {}),
    ...(sameAs.length > 0 ? { sameAs: sameAs.map((s) => s.url) } : {}),
    ...(expertise.length > 0
      ? { knowsAbout: expertise.map((e) => e.topic) }
      : {}),
    ...(credentials
      ? {
          hasCredential: {
            '@type': 'EducationalOccupationalCredential',
            name: credentials,
          },
        }
      : {}),
  }

  // ProfilePage with mainEntity = Person
  const profilePageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    url: canonicalUrl,
    name: `${name} - Author at ${SITE_NAME}`,
    ...(bioPlain ? { description: truncate(bioPlain, 500) } : {}),
    dateModified: user.updatedAt,
    mainEntity: personJsonLd,
  }

  // ItemList of authored posts
  const itemListJsonLd =
    posts.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          name: `Posts by ${name}`,
          url: canonicalUrl,
          numberOfItems: posts.length,
          itemListElement: posts.map((post, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            url: `${siteBase}/blog/${post.slug}`,
            item: {
              '@type': 'Article',
              '@id': `${siteBase}/blog/${post.slug}`,
              headline: post.title,
              url: `${siteBase}/blog/${post.slug}`,
              ...(post.publishedOn ? { datePublished: post.publishedOn } : {}),
              ...(post.excerpt?.trim() ? { description: post.excerpt.trim() } : {}),
              author: { '@id': `${canonicalUrl}#person` },
            },
          })),
        }
      : null

  return (
    <article className="pt-16 pb-24">
      <JsonLd data={profilePageJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      {itemListJsonLd ? <JsonLd data={itemListJsonLd} /> : null}

      <div className={cmsPageGutterClassName}>
        {/* Adjusted breadcrumb: Home > Authors > {name} */}
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link className="transition-colors hover:text-foreground" href="/">
                Home
              </Link>
            </li>
            <li aria-hidden>
              <ChevronRight className="size-3.5" />
            </li>
            <li>
              <Link className="transition-colors hover:text-foreground" href="/blog">
                Authors
              </Link>
            </li>
            <li aria-hidden>
              <ChevronRight className="size-3.5" />
            </li>
            <li>
              <span aria-current="page" className="font-medium text-foreground">
                {name}
              </span>
            </li>
          </ol>
        </nav>

        {/* Hidden BlogBreadcrumb for downstream consumers that look for the
            standard <BlogBreadcrumb> footprint per spec. */}
        <BlogBreadcrumb className="sr-only" title={name} />

        {/* Large AuthorBio header */}
        <header
          aria-label="About the author"
          className="mt-10 rounded-lg border border-border bg-muted/30 p-6 sm:p-10"
        >
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
            <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full border border-border bg-muted sm:h-36 sm:w-36">
              {photoUrl ? (
                <Image
                  alt={photoAlt}
                  className="object-cover"
                  fill
                  priority
                  sizes="144px"
                  src={photoUrl}
                />
              ) : (
                <div
                  aria-hidden
                  className="flex h-full w-full items-center justify-center bg-muted text-2xl font-semibold uppercase tracking-tight text-muted-foreground sm:text-3xl"
                >
                  {getInitials(name)}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                {name}
              </h1>

              {jobTitle ? (
                <p className="mt-1 text-base text-muted-foreground">{jobTitle}</p>
              ) : null}

              {bio ? (
                <div className="mt-5 text-base text-foreground/90">
                  <RichText
                    data={bio as Parameters<typeof RichText>[0]['data']}
                    enableGutter={false}
                    enableProse={false}
                  />
                </div>
              ) : null}

              {expertise.length > 0 ? (
                <div className="mt-6">
                  <h2 className="sr-only">Expertise</h2>
                  <ul aria-label="Expertise" className="flex flex-wrap gap-1.5">
                    {expertise.map((entry, index) => (
                      <li
                        className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground/80"
                        key={entry.id ?? `${entry.topic}-${index}`}
                      >
                        {entry.topic}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {credentials ? (
                <p className="mt-4 text-sm italic text-muted-foreground">{credentials}</p>
              ) : null}

              {sameAs.length > 0 ? (
                <ul
                  aria-label={`Profiles for ${name}`}
                  className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2"
                >
                  {sameAs.map((entry, index) => {
                    const label = platformLabelFromUrl(entry.url)
                    return (
                      <li key={entry.id ?? `${entry.url}-${index}`}>
                        <a
                          className={cn(
                            'inline-flex items-center gap-1 text-sm text-muted-foreground underline-offset-4 outline-none transition-colors',
                            'hover:text-foreground hover:underline focus-visible:text-foreground focus-visible:underline',
                          )}
                          href={entry.url}
                          rel="noopener noreferrer me"
                          target="_blank"
                        >
                          <span>Profile on {label}</span>
                        </a>
                      </li>
                    )
                  })}
                </ul>
              ) : null}
            </div>
          </div>
        </header>

        {/* Posts by this author */}
        <section aria-labelledby="author-posts-heading" className="mx-auto mt-16 max-w-3xl">
          <h2
            className="text-2xl font-semibold tracking-tight text-foreground"
            id="author-posts-heading"
          >
            {posts.length > 0 ? `Posts by ${name}` : `No posts yet by ${name}`}
          </h2>

          {posts.length > 0 ? (
            <ul className="mt-8 divide-y divide-border border-t border-border">
              {posts.map((post) => (
                <li className="py-6" key={post.id}>
                  <article>
                    <Link
                      className="group block"
                      href={`/blog/${post.slug}`}
                    >
                      <h3 className="text-xl font-semibold tracking-tight text-foreground transition-colors group-hover:text-foreground/80">
                        {post.title}
                      </h3>
                    </Link>
                    {post.publishedOn ? (
                      <time
                        className="mt-1 block text-xs text-muted-foreground"
                        dateTime={post.publishedOn}
                      >
                        {format(new Date(post.publishedOn), 'MMMM d, yyyy')}
                      </time>
                    ) : null}
                    {post.excerpt?.trim() ? (
                      <p className="mt-3 text-sm text-muted-foreground">
                        {post.excerpt.trim()}
                      </p>
                    ) : null}
                    <div className="mt-3">
                      <Link
                        className="inline-flex items-center text-sm font-medium text-foreground underline-offset-4 transition-colors hover:underline"
                        href={`/blog/${post.slug}`}
                      >
                        Read article
                        <span aria-hidden className="ml-1">→</span>
                      </Link>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 text-sm text-muted-foreground">
              Check back soon for articles from {name}.
            </p>
          )}
        </section>
      </div>
    </article>
  )
}
