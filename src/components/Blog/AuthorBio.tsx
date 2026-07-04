import Image from 'next/image'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import React from 'react'

import { RichText } from '@/components/RichText'
import type { Media, User } from '@/payload-types'
import { cn } from '@/utilities/cn'

type Props = {
  className?: string
  user: User | null | undefined
}

/**
 * Author initials for the photo fallback (max 2 chars).
 */
function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return ((parts[0]![0] ?? '') + (parts[parts.length - 1]![0] ?? '')).toUpperCase()
}

/**
 * Best-effort platform label from a sameAs URL, e.g. "LinkedIn", "Twitter/X",
 * "ORCID", or — when unknown — the bare hostname.
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

export function AuthorBio(props: Props) {
  const { className, user } = props

  if (!user) return null

  const profile = user.authorProfile
  const bio = profile?.bio ?? null
  const jobTitle = profile?.jobTitle ?? null

  // Render nothing if there's no bio AND no job title.
  if (!bio && !jobTitle) return null

  const name = user.name ?? 'Author'
  const expertise = (profile?.expertise ?? []).filter(
    (entry): entry is { topic: string; id?: string | null } =>
      Boolean(entry && typeof entry.topic === 'string' && entry.topic.trim()),
  )
  const credentials = profile?.credentials?.trim() ?? ''
  const sameAs = (profile?.sameAs ?? []).filter(
    (entry): entry is { url: string; id?: string | null } =>
      Boolean(entry && typeof entry.url === 'string' && entry.url.trim()),
  )
  const authorSlug = profile?.authorSlug?.trim() ?? ''

  const photoMedia: Media | null =
    typeof profile?.photo === 'object' && profile?.photo !== null ? (profile.photo as Media) : null
  const photoUrl = photoMedia?.url ?? null
  const photoAlt = photoMedia?.alt?.trim() || `Portrait of ${name}`

  return (
    <aside
      aria-label="About the author"
      className={cn(
        'mt-16 rounded-lg border border-border bg-muted/30 p-6 sm:p-8',
        className,
      )}
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
        {/* Photo or initials fallback */}
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-border bg-muted sm:h-24 sm:w-24">
          {photoUrl ? (
            <Image
              alt={photoAlt}
              className="object-cover"
              fill
              sizes="96px"
              src={photoUrl}
            />
          ) : (
            <div
              aria-hidden
              className="flex h-full w-full items-center justify-center bg-muted text-lg font-semibold uppercase tracking-tight text-muted-foreground sm:text-xl"
            >
              {getInitials(name)}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            {name}
          </h3>

          {jobTitle ? (
            <p className="mt-0.5 text-sm text-muted-foreground">{jobTitle}</p>
          ) : null}

          {bio ? (
            <div className="mt-3 text-sm text-foreground/90">
              <RichText
                data={bio as Parameters<typeof RichText>[0]['data']}
                enableGutter={false}
                enableProse={false}
              />
            </div>
          ) : null}

          {expertise.length > 0 ? (
            <div className="mt-4">
              <h4 className="sr-only">Expertise</h4>
              <ul aria-label="Expertise" className="flex flex-wrap gap-1.5">
                {expertise.map((entry, index) => (
                  <li
                    className="rounded-full border border-border bg-background px-2.5 py-0.5 text-xs font-medium text-foreground/80"
                    key={entry.id ?? `${entry.topic}-${index}`}
                  >
                    {entry.topic}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {credentials ? (
            <p className="mt-3 text-xs italic text-muted-foreground">{credentials}</p>
          ) : null}

          {sameAs.length > 0 ? (
            <ul
              aria-label={`Profiles for ${name}`}
              className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2"
            >
              {sameAs.map((entry, index) => {
                const label = platformLabelFromUrl(entry.url)
                return (
                  <li key={entry.id ?? `${entry.url}-${index}`}>
                    <a
                      className={cn(
                        'inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-4 outline-none transition-colors',
                        'hover:text-foreground hover:underline focus-visible:text-foreground focus-visible:underline',
                      )}
                      href={entry.url}
                      rel="noopener noreferrer me"
                      target="_blank"
                    >
                      <ExternalLink aria-hidden className="size-3.5" />
                      <span>Profile on {label}</span>
                    </a>
                  </li>
                )
              })}
            </ul>
          ) : null}

          {authorSlug ? (
            <div className="mt-5">
              <Link
                className={cn(
                  'inline-flex items-center text-sm font-medium text-foreground underline-offset-4 outline-none transition-colors',
                  'hover:underline focus-visible:underline',
                )}
                href={`/author/${authorSlug}`}
              >
                All posts by {name}
                <span aria-hidden className="ml-1">→</span>
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  )
}
