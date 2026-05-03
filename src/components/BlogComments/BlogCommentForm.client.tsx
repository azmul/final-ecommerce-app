'use client'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { LoggedBlogCommentViewer } from '@/components/BlogComments/types'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useCallback, useState } from 'react'
import { toast } from 'sonner'

type Props = {
  loggedInViewer: LoggedBlogCommentViewer
  loginReturnPath: string
  postId: number
}

export default function BlogCommentForm({ loggedInViewer, loginReturnPath, postId }: Props) {
  const router = useRouter()
  const [body, setBody] = useState('')
  const [pending, setPending] = useState(false)

  const submitComment = useCallback(async () => {
    const trimmed = body.trim()

    if (trimmed.length < 2) {
      toast.error('Comments must be at least 2 characters.')
      return
    }

    setPending(true)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/blog-comments`, {
        body: JSON.stringify({
          body: trimmed,
          post: postId,
        }),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      const json = (await res.json()) as {
        errors?: { message?: string }[]
        message?: string
      }

      if (!res.ok) {
        const msg =
          res.status === 403 ?
            'Please log in to post a comment.'
          : json?.errors?.[0]?.message ?? json?.message ?? 'Something went wrong. Please try again.'
        toast.error(msg)
        return
      }

      toast.success('Thanks — your comment was submitted and will appear after moderation.')
      setBody('')
      router.refresh()
    } catch {
      toast.error('Network error — please try again.')
    } finally {
      setPending(false)
    }
  }, [body, postId, router])

  const loginHref = `/login?redirect=${encodeURIComponent(loginReturnPath)}`

  return (
    <div className="mt-10">
      {!loggedInViewer ?
        <p className="text-sm text-muted-foreground">
          <Link className="text-foreground underline underline-offset-4" href={loginHref}>
            Log in
          </Link>{' '}
          to leave a comment on this article.
        </p>
      : <div className="rounded-lg border border-border bg-card p-4">
          <Label className="text-sm font-medium" htmlFor="blog-comment-body">
            Add a comment
          </Label>
          <Textarea
            className="mt-2 min-h-[120px] resize-y text-sm"
            disabled={pending}
            id="blog-comment-body"
            maxLength={2000}
            onChange={(e) => setBody(e.target.value)}
            placeholder={
              loggedInViewer.name?.trim()?.length ?
                `Commenting as ${loggedInViewer.name}`
              : 'Write your comment…'
            }
            value={body}
          />
          <div className="mt-3 flex justify-end">
            <Button disabled={pending} onClick={() => void submitComment()} type="button">
              {pending ? 'Posting…' : 'Post comment'}
            </Button>
          </div>
        </div>
      }
    </div>
  )
}
