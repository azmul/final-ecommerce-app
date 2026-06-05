'use client'

import type { ProductQuestion } from '@/payload-types'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/providers/Auth'
import { getServerSideURL } from '@/utilities/getURL'
import { formatDistanceToNow } from 'date-fns'
import { HelpCircle, Loader2Icon } from 'lucide-react'
import Link from 'next/link'
import React, { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { stringify as stringifyQuery } from 'qs-esm'

type Props = {
  embedded?: boolean
  productId: number
}

export function ProductQuestionsSection({ embedded = false, productId }: Props) {
  const { user } = useAuth()
  const base = getServerSideURL()
  const [questions, setQuestions] = useState<ProductQuestion[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [question, setQuestion] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const query = stringifyQuery({
        depth: 0,
        limit: 20,
        sort: '-createdAt',
        where: {
          product: { equals: productId },
        },
      })
      const res = await fetch(`${base}/api/product-questions?${query}`, {
        credentials: 'include',
      })
      const json = (await res.json()) as { docs?: ProductQuestion[] }
      setQuestions(json.docs ?? [])
    } finally {
      setLoading(false)
    }
  }, [base, productId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!user) return
    setSubmitting(true)
    try {
      const res = await fetch(`${base}/api/product-questions`, {
        body: JSON.stringify({ product: productId, question: question.trim() }),
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      if (!res.ok) throw new Error('Could not submit question.')
      setQuestion('')
      toast.success('Question submitted. We will answer soon.')
      await refresh()
    } catch {
      toast.error('Could not submit question.')
    } finally {
      setSubmitting(false)
    }
  }

  const answered = questions.filter((q) => q.status === 'answered' && q.answer)

  const body = (
    <>
      {embedded ?
        <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
          Ask before you buy — answered questions help other shoppers too.
        </p>
      : null}

      {user ?
        <form className="mb-6 space-y-3" onSubmit={handleSubmit}>
          <Textarea
            minLength={10}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about sizing, compatibility, warranty, delivery…"
            required
            rows={3}
            value={question}
          />
          <Button disabled={submitting || question.trim().length < 10} type="submit">
            {submitting ?
              <>
                <Loader2Icon className="mr-2 size-4 animate-spin" />
                Submitting…
              </>
            : 'Ask a question'}
          </Button>
        </form>
      : <p className="mb-6 text-sm text-muted-foreground">
          <Link className="underline" href="/login">
            Sign in
          </Link>{' '}
          to ask a question about this product.
        </p>
      }

      {loading ?
        <p className="text-sm text-muted-foreground">Loading questions…</p>
      : answered.length === 0 ?
        <p className="text-sm text-muted-foreground">No answered questions yet.</p>
      : <ul className="flex flex-col gap-4">
          {answered.map((item) => (
            <li key={item.id} className="rounded-lg border bg-background px-4 py-4">
              <p className="font-medium">{item.question}</p>
              <p className="mt-2 text-sm text-muted-foreground">{item.answer}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {item.askerDisplayName}
                {item.answeredAt ?
                  ` · answered ${formatDistanceToNow(new Date(item.answeredAt), { addSuffix: true })}`
                : null}
              </p>
            </li>
          ))}
        </ul>
      }
    </>
  )

  if (embedded) {
    return <div className="min-w-0">{body}</div>
  }

  return (
    <section className="rounded-2xl border border-border/70 bg-muted/10 p-6">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl border bg-background text-primary">
          <HelpCircle aria-hidden className="size-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Questions & answers</h2>
          <p className="text-sm text-muted-foreground">
            Ask before you buy — answered questions help other shoppers too.
          </p>
        </div>
      </div>
      {body}
    </section>
  )
}
