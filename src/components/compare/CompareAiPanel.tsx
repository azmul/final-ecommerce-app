'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/utilities/cn'
import { Loader2, Sparkles } from 'lucide-react'
import React, { useState } from 'react'

type CompareAiResult = {
  recommendation: string
  tradeoffs: string[]
  valueWinnerId: number | null
  valueWinnerTitle: string | null
  winnerId: number | null
  winnerTitle: string | null
}

type Props = {
  productIds: number[]
}

export function CompareAiPanel({ productIds }: Props) {
  const [loading, setLoading] = useState(false)
  const [question, setQuestion] = useState('')
  const [result, setResult] = useState<CompareAiResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const runComparison = async (customQuestion?: string) => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/ai/compare', {
        body: JSON.stringify({
          ids: productIds,
          question: customQuestion?.trim() || question.trim() || undefined,
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })

      const json = (await res.json()) as { comparison?: CompareAiResult; error?: string }
      if (!res.ok) {
        throw new Error(json.error ?? 'Comparison failed.')
      }

      setResult(json.comparison ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Comparison failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mb-8 rounded-2xl border border-primary/25 bg-primary/5 p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Sparkles aria-hidden className="size-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">AI comparison</h2>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        Ask which product is better value, what differs, or who each option suits best.
      </p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm"
          onChange={(e) => setQuestion(e.target.value)}
          placeholder='e.g. "Which gives better value for money?"'
          type="text"
          value={question}
        />
        <Button disabled={loading} onClick={() => runComparison()} type="button">
          {loading ?
            <>
              <Loader2 aria-hidden className="mr-2 size-4 animate-spin" />
              Comparing…
            </>
          : 'Compare with AI'}
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {['Which is better overall?', 'Best value for money?', 'What are the main differences?'].map(
          (prompt) => (
            <button
              className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground hover:border-primary hover:text-primary"
              key={prompt}
              onClick={() => {
                setQuestion(prompt)
                void runComparison(prompt)
              }}
              type="button"
            >
              {prompt}
            </button>
          ),
        )}
      </div>

      {error ?
        <p className="mt-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      : null}

      {result ?
        <div className="mt-5 space-y-4 rounded-xl border border-border/70 bg-background p-4">
          <p className="text-sm leading-relaxed text-foreground">{result.recommendation}</p>

          {(result.winnerTitle || result.valueWinnerTitle) && (
            <div className="flex flex-wrap gap-3 text-sm">
              {result.winnerTitle ?
                <span className={cn('rounded-md bg-emerald-500/10 px-2.5 py-1 font-medium text-emerald-800 dark:text-emerald-300')}>
                  Best overall: {result.winnerTitle}
                </span>
              : null}
              {result.valueWinnerTitle && result.valueWinnerTitle !== result.winnerTitle ?
                <span className="rounded-md bg-primary/10 px-2.5 py-1 font-medium text-primary">
                  Best value: {result.valueWinnerTitle}
                </span>
              : null}
            </div>
          )}

          {result.tradeoffs.length > 0 && (
            <ul className="space-y-1 text-sm text-muted-foreground">
              {result.tradeoffs.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          )}
        </div>
      : null}
    </section>
  )
}
