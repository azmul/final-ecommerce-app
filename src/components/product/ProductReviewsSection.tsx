'use client'

import type { ProductReview, User } from '@/payload-types'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/providers/Auth'
import { getServerSideURL } from '@/utilities/getURL'
import { cn } from '@/utilities/cn'
import { stringify as stringifyQuery } from 'qs-esm'
import { formatDistanceToNow } from 'date-fns'
import { BadgeCheck, ChevronDown, Loader2Icon, Trash2Icon } from 'lucide-react'
import { queueStateUpdate } from '@/hooks/queueStateUpdate'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { averageToStarDisplay, StarRating } from '@/components/product/StarRating'
import { ProductReviewSummary } from '@/components/product/ProductReviewSummary'
import { Media } from '@/components/Media'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const PAGE_LIMIT = 8

export type ProductReviewsSectionProps = {
  embedded?: boolean
  productId: number
  reviewSummary?: {
    commonComplaints?: { item?: string | null }[] | null
    cons?: { item?: string | null }[] | null
    pros?: { item?: string | null }[] | null
    sentiment?: number | null
    text?: string | null
  } | null
  storefrontAverage: number | null | undefined
  storefrontCount: number | null | undefined
}

async function payloadErrorMessage(response: Response): Promise<string> {
  try {
    const json = (await response.json()) as { errors?: { message?: string }[] }
    const first = json?.errors?.[0]?.message?.trim()

    return first ?? `Request failed (${response.status}).`
  } catch {
    return `Request failed (${response.status}).`
  }
}

export function ProductReviewsSection({
  embedded = false,
  productId,
  reviewSummary,
  storefrontAverage,
  storefrontCount,
}: ProductReviewsSectionProps) {
  const router = useRouter()
  const base = getServerSideURL()
  const { user } = useAuth()

  const [reviews, setReviews] = useState<ProductReview[]>([])
  const [hasNextPage, setHasNextPage] = useState(false)
  const [limit, setLimit] = useState(PAGE_LIMIT)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [rating, setRating] = useState(5)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [ratingFilter, setRatingFilter] = useState<number | null>(null)
  const [helpfulBusyId, setHelpfulBusyId] = useState<number | null>(null)
  const [photoFiles, setPhotoFiles] = useState<File[]>([])

  const myReviewsSorted = useMemo(() => {
    if (!user) return []

    const uid = (user as User).id

    return reviews
      .filter((r) => typeof r.author === 'number' && r.author === uid)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [reviews, user])

  const myActiveReview = myReviewsSorted.find(
    (r) => r.moderationStatus === 'pending' || r.moderationStatus === 'approved',
  )

  const myRejectedReview = myReviewsSorted.find((r) => r.moderationStatus === 'rejected')

  useEffect(() => {
    const seed = myRejectedReview

    if (!seed) {
      return
    }

    queueStateUpdate(() => {
      setRating(seed.rating)
      setTitle(seed.title?.trim() ? seed.title : '')
      setBody(seed.body)
    })
  }, [myRejectedReview?.id])

  const refreshList = useCallback(async () => {
    setLoading(true)

    try {
      const where: Record<string, unknown> = {
        and: [
          {
            product: {
              equals: productId,
            },
          },
          ...(ratingFilter != null ?
            [{ rating: { equals: ratingFilter } }]
          : []),
        ],
      }

      const query = stringifyQuery(
        {
          depth: 1,
          limit,
          sort: '-createdAt',
          where,
        },
        { addQueryPrefix: true },
      )

      const res = await fetch(`${base}/api/product-reviews${query}`, {
        credentials: 'include',
        headers: { Accept: 'application/json' },
        method: 'GET',
      })

      if (!res.ok) {
        throw new Error(await payloadErrorMessage(res))
      }

      const json = (await res.json()) as {
        docs?: ProductReview[]
        hasNextPage?: boolean
      }

      setReviews(Array.isArray(json.docs) ? json.docs : [])
      setHasNextPage(Boolean(json.hasNextPage))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Unable to load reviews.')
    } finally {
      setLoading(false)
    }
  }, [base, limit, productId, ratingFilter])

  useEffect(() => {
    queueStateUpdate(() => {
      void refreshList()
    })
  }, [refreshList])

  async function submitReview(ev: React.FormEvent) {
    ev.preventDefault()

    if (!user) {
      toast.error('Sign in to leave a review.')
      return
    }

    if (body.trim().length < 10) {
      toast.error('Please write at least 10 characters in your review.')
      return
    }

    setSubmitting(true)

    try {
      const editingRejectedId = myRejectedReview?.id
      const updating = typeof editingRejectedId === 'number'

      const payload = updating ?
        {
          body: body.trim(),
          rating,
          title: title.trim() || undefined,
        }
      : {
          body: body.trim(),
          product: productId,
          rating,
          title: title.trim() || undefined,
        }

      const res = await fetch(
        updating ? `${base}/api/product-reviews/${editingRejectedId}` : `${base}/api/product-reviews`,
        {
          body: JSON.stringify(payload),
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          method: updating ? 'PATCH' : 'POST',
        },
      )

      if (!res.ok) {
        throw new Error(await payloadErrorMessage(res))
      }

      const created = (await res.json()) as { doc?: ProductReview; id?: number }
      const reviewId = created.doc?.id ?? created.id ?? editingRejectedId

      if (typeof reviewId === 'number' && photoFiles.length) {
        for (const file of photoFiles.slice(0, 3)) {
          const formData = new FormData()
          formData.set('reviewId', String(reviewId))
          formData.set('file', file)
          await fetch(`${base}/api/product-reviews/photos`, {
            body: formData,
            credentials: 'include',
            method: 'POST',
          })
        }
      }

      toast.success(
        updating ?
          'Thanks! Your updated review went back into the moderation queue.'
        : 'Thanks! Your review was submitted and will appear after a quick check.',
      )
      setTitle('')
      setBody('')
      setRating(5)
      setPhotoFiles([])
      await refreshList()
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not submit review.')
    } finally {
      setSubmitting(false)
    }
  }

  async function markHelpful(reviewId: number) {
    setHelpfulBusyId(reviewId)
    try {
      const res = await fetch(`${base}/api/product-reviews/${reviewId}/helpful`, {
        credentials: 'include',
        method: 'POST',
      })
      if (!res.ok) throw new Error('Could not record vote.')
      const json = (await res.json()) as { helpfulCount?: number }
      setReviews((prev) =>
        prev.map((row) =>
          row.id === reviewId ?
            { ...row, helpfulCount: json.helpfulCount ?? (row.helpfulCount ?? 0) + 1 }
          : row,
        ),
      )
    } catch {
      toast.error('Could not record helpful vote.')
    } finally {
      setHelpfulBusyId(null)
    }
  }

  async function deleteMine(reviewId: number) {
    if (!window.confirm('Remove your review permanently?')) return

    try {
      const res = await fetch(`${base}/api/product-reviews/${reviewId}`, {
        credentials: 'include',
        method: 'DELETE',
      })

      if (!res.ok) {
        throw new Error(await payloadErrorMessage(res))
      }

      toast.success('Your review was removed.')
      await refreshList()
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not delete review.')
    }
  }

  const shownAverage =
    typeof storefrontAverage === 'number' && !Number.isNaN(storefrontAverage) ? storefrontAverage
    : (() => {
        const approvedOnly = reviews.filter((r) => r.moderationStatus === 'approved')

        if (!approvedOnly.length) return null

        const sum = approvedOnly.reduce((acc, r) => acc + r.rating, 0)

        return Math.round((sum / approvedOnly.length) * 100) / 100
      })()

  const shownCount =
    typeof storefrontCount === 'number' && storefrontCount > 0 ? storefrontCount
    : reviews.filter((r) => r.moderationStatus === 'approved').length

  const ratingSummary =
    shownAverage !== null && typeof shownAverage === 'number' && shownCount ?
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/65 bg-muted/25 px-4 py-3 dark:bg-muted/20">
        <StarRating
          readOnly
          size="sm"
          value={averageToStarDisplay(Math.round(shownAverage))}
          label={`Average ${shownAverage.toFixed(1)} out of 5 stars`}
        />
        <div>
          <p className="text-sm font-semibold text-foreground">{shownAverage.toFixed(1)} out of 5</p>
          <p className="text-xs text-muted-foreground">
            {shownCount} approved {shownCount === 1 ? 'review' : 'reviews'}
          </p>
        </div>
      </div>
    : <p className="text-sm text-muted-foreground">No reviews yet — be the first to share yours.</p>

  const content = (
      <div className={cn(embedded ? 'space-y-8' : 'mt-6 space-y-8')}>
        {user && myActiveReview?.moderationStatus === 'approved' ?
          <p className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-sm leading-relaxed text-muted-foreground dark:bg-muted/15">
            You&apos;ve reviewed this item—thank you for helping other shoppers decide.
          </p>
        : null}

        {user && myActiveReview?.moderationStatus === 'pending' ?
          <div className="rounded-xl border border-amber-500/35 bg-amber-500/8 px-4 py-3 text-sm text-amber-950 dark:text-amber-100" role="status">
            Your latest review is awaiting moderation and is visible only to you until it&apos;s approved.
          </div>
        : null}

        {user && myRejectedReview ?
          <div className="rounded-xl border border-destructive/35 bg-destructive/10 px-4 py-3 text-sm text-destructive dark:text-destructive" role="status">
            This review wasn&apos;t published. Adjust the wording below and submit again, or delete it anytime.
          </div>
        : null}

        {user && !myActiveReview ?
          <form
            className="min-w-0 w-full max-w-full space-y-4 rounded-2xl border border-dashed border-primary/35 bg-primary/5 p-4 sm:p-5 dark:bg-primary/8"
            noValidate
            onSubmit={submitReview}
          >
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                {myRejectedReview ? 'Revise your review' : 'Write a review'}
              </p>
              <p className="text-xs text-muted-foreground sm:text-sm">
                One review slot per shopper per item. Completed orders qualify for the verified-buyer badge.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Label className="text-sm text-muted-foreground" htmlFor="review-star-input">
                Your rating
              </Label>
              <span id="review-star-input">
                <StarRating label="Pick a star rating" onChange={setRating} size="md" value={rating} />
              </span>
            </div>

            <div className="space-y-2">
              <Label className="text-sm" htmlFor="review-title">
                Title <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <input
                autoComplete="off"
                className={cn(
                  'flex h-11 min-h-11 w-full max-w-full rounded-xl border border-input bg-background px-3 py-2 text-base sm:h-10 sm:min-h-0 sm:max-w-xl sm:text-sm',
                  'ring-offset-background outline-none placeholder:text-muted-foreground',
                  'focus-visible:border-primary/55 focus-visible:ring-2 focus-visible:ring-ring/60',
                )}
                id="review-title"
                maxLength={120}
                placeholder="Summarize your experience"
                value={title}
                onChange={(ev) => setTitle(ev.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="review-body">Review</Label>
              <Textarea
                className="min-h-[112px] w-full max-w-full rounded-xl text-base sm:max-w-xl sm:text-sm"
                id="review-body"
                placeholder="What worked well? What could improve?"
                rows={5}
                value={body}
                onChange={(ev) => setBody(ev.target.value)}
              />
              <p className="text-xs text-muted-foreground">{body.trim().length} / 2000 · minimum 10 characters</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="review-photos">Photos (optional)</Label>
              <input
                accept="image/*"
                className="block w-full max-w-xl text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-foreground"
                id="review-photos"
                multiple
                onChange={(ev) => {
                  const files = ev.target.files ? Array.from(ev.target.files).slice(0, 3) : []
                  setPhotoFiles(files)
                }}
                type="file"
              />
              {photoFiles.length ?
                <p className="text-xs text-muted-foreground">{photoFiles.length} photo(s) selected</p>
              : null}
            </div>

            <Button
              className="h-11 w-full touch-manipulation sm:h-10 sm:w-auto [-webkit-tap-highlight-color:transparent]"
              disabled={submitting}
              type="submit"
            >
              {submitting ?
                <>
                  <Loader2Icon aria-hidden className="mr-2 size-4 animate-spin" />
                  {myRejectedReview ? 'Sending update…' : 'Submitting…'}
                </>
              : myRejectedReview ?
                'Resubmit revised review'
              : 'Submit review'}
            </Button>
          </form>
        : null}

        <div className="space-y-5">
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 gap-y-2 sm:gap-4">
            <h3 className="text-lg font-semibold text-foreground">Customer reviews</h3>
            <div className="flex flex-wrap items-center gap-2">
              {[5, 4, 3, 2, 1].map((stars) => (
                <Button
                  key={stars}
                  onClick={() => setRatingFilter((prev) => (prev === stars ? null : stars))}
                  size="sm"
                  type="button"
                  variant={ratingFilter === stars ? 'default' : 'outline'}
                >
                  {stars}★
                </Button>
              ))}
            </div>
            {loading ?
              <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2Icon aria-hidden className="size-3.5 animate-spin" /> Updating…
              </span>
            : null}
          </div>

          {reviews.length === 0 && !loading ?
            <p className="rounded-xl border border-border/65 bg-muted/15 px-4 py-6 text-center text-sm text-muted-foreground dark:bg-muted/10">
              {user ?
                'No reviews yet. Share your experience above.'
              : <>
                  <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/login">
                    Sign in
                  </Link>{' '}
                  to leave a review for items you&apos;ve purchased.
                </>
              }
            </p>
          : (
            <ul className="space-y-6 [&>li]:min-w-0">
              {reviews.map((r) => (
                <li key={r.id}>
                  <article className="rounded-2xl border border-border/65 bg-background/80 p-4 sm:p-5 dark:bg-background/50">
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/40 pb-3">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">{r.reviewerDisplayName}</p>
                        <time className="text-xs text-muted-foreground" dateTime={r.createdAt}>
                          {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                        </time>
                      </div>
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {r.verifiedPurchase ?
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-200">
                            <BadgeCheck aria-hidden className="size-3.5" /> Verified purchase
                          </span>
                        : null}
                        {r.moderationStatus !== 'approved' ?
                          <span className="rounded-full border border-border/80 bg-muted/50 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                            {r.moderationStatus === 'pending' ? 'Pending' : 'Not published'}
                          </span>
                        : null}
                      </div>
                    </div>

                    <div className="mt-3 flex min-w-0 flex-wrap items-center gap-3">
                      <StarRating readOnly size="sm" value={r.rating} label={`${r.rating} out of 5 stars`} />
                      {r.title ?
                        <h4 className="min-w-0 max-w-full text-base font-medium wrap-break-word text-foreground">{r.title}</h4>
                      : null}
                    </div>

                    <p className="mt-3 max-w-full min-w-0 whitespace-pre-wrap wrap-break-word text-sm leading-relaxed text-muted-foreground">{r.body}</p>

                    {Array.isArray(r.photos) && r.photos.length > 0 ?
                      <ul className="mt-3 flex flex-wrap gap-2">
                        {r.photos.map((row, index) => {
                          const resource =
                            row && typeof row === 'object' && row.photo && typeof row.photo === 'object' ?
                              row.photo
                            : null
                          if (!resource) return null
                          return (
                            <li key={`${r.id}-photo-${index}`}>
                              <div className="relative size-20 overflow-hidden rounded-lg ring-1 ring-border/60">
                                <Media
                                  className="relative size-full"
                                  fill
                                  imgClassName="object-cover"
                                  resource={resource}
                                />
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    : null}

                    {r.moderationStatus === 'approved' ?
                      <div className="mt-4">
                        <Button
                          disabled={helpfulBusyId === r.id}
                          onClick={() => void markHelpful(r.id)}
                          size="sm"
                          type="button"
                          variant="outline"
                        >
                          Helpful ({typeof r.helpfulCount === 'number' ? r.helpfulCount : 0})
                        </Button>
                      </div>
                    : null}

                    {user && typeof r.author === 'number' && r.author === (user as User).id ?
                      <div className="mt-4 flex w-full justify-stretch sm:w-auto sm:justify-end">
                        <Button
                          className="h-11 min-h-11 w-full touch-manipulation gap-2 text-destructive [-webkit-tap-highlight-color:transparent] hover:text-destructive sm:h-9 sm:min-h-0 sm:w-auto"
                          size="sm"
                          type="button"
                          variant="ghost"
                          onClick={() => deleteMine(r.id)}
                        >
                          <Trash2Icon aria-hidden className="size-4" /> Delete my review
                        </Button>
                      </div>
                    : null}
                  </article>
                </li>
              ))}
            </ul>
          )}
        </div>

        {hasNextPage ?
          <div className="flex justify-center pt-2">
            <Button
              className="h-11 w-full touch-manipulation [-webkit-tap-highlight-color:transparent] sm:h-10 sm:w-auto"
              disabled={loading}
              type="button"
              variant="outline"
              onClick={() => setLimit((l) => l + PAGE_LIMIT)}
            >
              <ChevronDown aria-hidden className="mr-2 size-4" /> Load more
            </Button>
          </div>
        : null}
      </div>
  )

  if (embedded) {
    return (
      <div className="min-w-0" id="product-reviews">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            Honest feedback from shoppers. New submissions are screened before they appear for everyone.
          </p>
          {ratingSummary}
        </div>
        <ProductReviewSummary className="mb-6" reviewSummary={reviewSummary} />
        {content}
      </div>
    )
  }

  return (
    <section
      aria-labelledby="product-reviews-heading"
      className="min-w-0 w-full scroll-mt-24 rounded-2xl border border-border/80 bg-card/35 p-4 sm:p-7 md:p-8 dark:border-border dark:bg-card/20"
      id="product-reviews"
    >
      <header className="mb-6 flex min-w-0 flex-col gap-4 border-b border-border/70 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-3">
          <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl" id="product-reviews-heading">
            Ratings &amp; reviews
          </h2>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
            Honest feedback from shoppers. Ratings use a 5-star scale. New submissions are screened for quality and
            policy before they appear for everyone.
          </p>
        </div>

        <div className="flex w-full min-w-0 shrink-0 flex-col items-start gap-2 rounded-2xl border border-border/65 bg-muted/25 px-4 py-3 sm:w-auto sm:max-w-sm sm:items-end sm:text-right dark:bg-muted/20">
          {shownAverage !== null && typeof shownAverage === 'number' && shownCount ? (
            <>
              <div className="flex flex-wrap items-center gap-3 sm:flex-row-reverse">
                <span aria-hidden className="text-sm font-semibold text-foreground sm:text-lg">
                  {shownAverage.toFixed(1)}
                </span>
                <StarRating
                  readOnly
                  size="sm"
                  value={averageToStarDisplay(Math.round(shownAverage))}
                  label={`Average ${shownAverage.toFixed(1)} out of 5 stars`}
                />
              </div>
              <p className="text-xs text-muted-foreground sm:text-[13px]">
                Based on {shownCount} approved {shownCount === 1 ? 'review' : 'reviews'}.
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No reviews yet — be the first to share yours.</p>
          )}
        </div>
      </header>
      <ProductReviewSummary className="mb-6" reviewSummary={reviewSummary} />
      {content}
    </section>
  )
}
