import configPromise from '@payload-config'
import { format } from 'date-fns'
import type { BlogComment } from '@/payload-types'
import type { Payload } from 'payload'
import { getPayload } from 'payload'

import BlogCommentForm from './BlogCommentForm.client'
import type { LoggedBlogCommentViewer } from './types'
import { cn } from '@/utilities/cn'

function getCommentAuthorId(comment: BlogComment): number | undefined {
  const raw = comment.author

  if (typeof raw === 'number') {
    return raw
  }

  if (
    typeof raw === 'object' &&
    raw !== null &&
    'id' in raw &&
    typeof (raw as { id: unknown }).id === 'number'
  ) {
    return (raw as { id: number }).id
  }

  return undefined
}

type AuthorProfile = {
  name: string | null
}

async function fetchAuthorProfiles(
  payload: Payload,
  authorIds: number[],
): Promise<Map<number, AuthorProfile>> {
  const map = new Map<number, AuthorProfile>()
  const unique = [...new Set(authorIds)]

  if (unique.length === 0) {
    return map
  }

  await Promise.all(
    unique.map(async (id) => {
      const userDoc = await payload.findByID({
        collection: 'users',
        depth: 0,
        id,
        overrideAccess: true,
        select: {
          name: true,
        },
      })

      if (!userDoc) {
        return
      }

      const nameTrimmed =
        typeof userDoc.name === 'string' && userDoc.name.trim().length > 0 ?
          userDoc.name.trim()
        : null

      map.set(id, { name: nameTrimmed })
    }),
  )

  return map
}

export async function BlogComments({
  loggedInViewer,
  loginReturnPath,
  postId,
}: {
  loggedInViewer: LoggedBlogCommentViewer
  loginReturnPath: string
  postId: number
}) {
  const payload = await getPayload({ config: configPromise })

  const { docs } = await payload.find({
    collection: 'blog-comments',
    depth: 0,
    limit: 200,
    overrideAccess: false,
    pagination: false,
    sort: 'createdAt',
    where: {
      post: {
        equals: postId,
      },
    },
  })

  const comments = docs as BlogComment[]

  const authorIds = comments.map(getCommentAuthorId).filter((id): id is number => typeof id === 'number')

  const authorProfiles =
    comments.length > 0 ? await fetchAuthorProfiles(payload, authorIds) : new Map<number, AuthorProfile>()

  return (
    <section className="mx-auto mt-16 max-w-3xl border-t border-border pt-12" id="comments">
      <h2 className="text-xl font-semibold tracking-tight">
        Comments{comments.length > 0 ? ` (${comments.length})` : ''}
      </h2>
      <p className="mt-2 text-muted-foreground text-xs">
        Approved comments appear here after a moderator reviews them.
      </p>

      {comments.length === 0 ?
        <p className="mt-6 text-muted-foreground text-sm">
          No approved comments yet. Share yours below—it will show once approved.
        </p>
      : <ul className="mt-10 space-y-10">
          {comments.map((comment) => {
            const authorId = getCommentAuthorId(comment)
            const profile = typeof authorId === 'number' ? authorProfiles.get(authorId) : undefined

            const displayName =
              typeof profile?.name === 'string' && profile.name.length > 0 ? profile.name : null

            const label = displayName ?? 'Someone'

            return (
              <li className="border-b border-border pb-10 last:border-0 last:pb-0" key={comment.id}>
                <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                  <div className="min-w-0">
                    <div
                      className={cn(
                        'text-sm font-semibold',
                        !displayName ? 'text-muted-foreground' : null,
                      )}
                    >
                      {label}
                    </div>
                  </div>
                  <time
                    className="shrink-0 text-xs text-muted-foreground"
                    dateTime={comment.createdAt}
                  >
                    {format(new Date(comment.createdAt), 'MMM d, yyyy · h:mm a')}
                  </time>
                </div>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                  {comment.body ?? ''}
                </p>
              </li>
            )
          })}
        </ul>
      }

      <BlogCommentForm
        loggedInViewer={loggedInViewer}
        loginReturnPath={loginReturnPath}
        postId={postId}
      />
    </section>
  )
}
