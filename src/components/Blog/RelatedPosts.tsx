import type { Media, Post, User } from '@/payload-types'

import { Media as MediaCmp } from '@/components/Media'
import { format } from 'date-fns'
import Link from 'next/link'
import React from 'react'

import { cn } from '@/utilities/cn'

export function normalizedRelatedPosts(
  relatedPosts: Post['relatedPosts'],
  currentPostId: number,
): Post[] {
  if (!relatedPosts?.length) return []

  return relatedPosts.filter((entry): entry is Post => {
    if (entry === null || typeof entry !== 'object') return false
    if ('id' in entry && entry.id === currentPostId) return false
    return typeof entry.slug === 'string'
  })
}

export function RelatedPosts(props: {
  className?: string
  /** Current article id — excluded if present in CMS data */
  currentPostId: number
  /** `sidebar`: narrow stacked list for beside the article; `grid`: full-width card grid below */
  layout?: 'grid' | 'sidebar'
  relatedPosts: Post['relatedPosts']
}) {
  const { className, currentPostId, layout = 'grid', relatedPosts } = props
  const items = normalizedRelatedPosts(relatedPosts, currentPostId)

  if (items.length === 0) return null

  if (layout === 'sidebar') {
    return (
      <section
        aria-labelledby="related-posts-heading"
        className={cn(className)}
      >
        <h2
          id="related-posts-heading"
          className="text-sm font-semibold tracking-tight text-foreground lg:text-[0.825rem]"
        >
          Related posts
        </h2>
        <ul className="mt-5 flex flex-col gap-7">
          {items.map((post) => {
            const image =
              typeof post.featuredImage === 'object' && post.featuredImage !== null ?
                (post.featuredImage as Media)
              : undefined
            const author =
              typeof post.author === 'object' && post.author !== null ?
                (post.author as User)
              : null

            return (
              <li key={post.id}>
                <Link
                  className={cn(
                    'group flex gap-3 rounded-md outline-none ring-offset-background transition-colors',
                    'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  )}
                  href={`/blog/${post.slug}`}
                >
                  <div className="relative h-14 w-[4.75rem] shrink-0 overflow-hidden rounded border border-border/60 bg-muted">
                    {image ?
                      <MediaCmp
                        className="relative h-full w-full"
                        fill
                        imgClassName="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                        resource={image}
                        size="120px"
                      />
                    : null}
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <time
                      className="block text-[0.65rem] leading-none uppercase tracking-wide text-muted-foreground"
                      dateTime={post.publishedOn ?? undefined}
                    >
                      {post.publishedOn ?
                        format(new Date(post.publishedOn), 'MMM d, yyyy')
                      : 'Draft'}
                    </time>
                    <span className="mt-1 block text-sm font-medium leading-snug text-foreground group-hover:underline decoration-foreground/40 underline-offset-[3px]">
                      {post.title}
                    </span>
                    {author?.name ?
                      <span className="mt-1 block truncate text-[0.7rem] text-muted-foreground">
                        {author.name}
                      </span>
                    : null}
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      </section>
    )
  }

  return (
    <section
      aria-labelledby="related-posts-heading"
      className={cn('mt-20 border-t border-border pt-14', className)}
    >
      <h2
        id="related-posts-heading"
        className="text-lg font-semibold tracking-tight sm:text-xl"
      >
        Related posts
      </h2>
      <ul
        className={cn(
          'mt-8 grid gap-x-10 gap-y-12',
          items.length >= 3 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2',
        )}
      >
        {items.map((post) => {
          const image =
            typeof post.featuredImage === 'object' && post.featuredImage !== null ?
              (post.featuredImage as Media)
            : undefined
          const author =
            typeof post.author === 'object' && post.author !== null ? (post.author as User) : null

          return (
            <li key={post.id}>
              <Link
                className="group flex flex-col border-t border-border pt-8 transition-colors hover:border-foreground"
                href={`/blog/${post.slug}`}
              >
                <div className="relative mb-5 aspect-[16/10] w-full overflow-hidden rounded-md bg-muted">
                  {image ?
                    <MediaCmp
                      className="relative h-full w-full"
                      fill
                      imgClassName="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                      resource={image}
                      size="(max-width: 768px) 100vw, 33vw"
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

                <span className="mt-2 text-xl font-semibold tracking-tight group-hover:underline decoration-foreground/40 underline-offset-4">
                  {post.title}
                </span>

                {post.excerpt ?
                  <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{post.excerpt}</p>
                : null}

                {author?.name ?
                  <p className="mt-4 text-xs text-muted-foreground">By {author.name}</p>
                : null}
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
