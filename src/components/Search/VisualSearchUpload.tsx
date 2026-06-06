'use client'

import type { AiProductResult } from '@/lib/ai/types'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import React, { useRef, useState } from 'react'
import { Camera, Loader2, Sparkles } from 'lucide-react'

export function VisualSearchUpload() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [description, setDescription] = useState<string | null>(null)
  const [products, setProducts] = useState<AiProductResult[]>([])
  const [descriptionHint, setDescriptionHint] = useState('')
  const [error, setError] = useState<string | null>(null)

  const onFile = async (file: File | null) => {
    if (!file) return
    setLoading(true)
    setError(null)
    setProducts([])
    setDescription(null)

    try {
      const form = new FormData()
      form.append('image', file)
      if (descriptionHint.trim()) form.append('description', descriptionHint.trim())

      const res = await fetch('/api/ai/visual-search', {
        body: form,
        method: 'POST',
      })

      const json = (await res.json()) as {
        description?: string | null
        products?: AiProductResult[]
        error?: string
      }

      if (!res.ok) throw new Error(json.error ?? 'Visual search failed.')

      setDescription(json.description ?? null)
      setProducts(Array.isArray(json.products) ? json.products : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Visual search failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="rounded-xl border border-border/80 bg-muted/15 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles aria-hidden className="size-4 text-primary" />
        <h3 className="text-sm font-semibold">Visual search</h3>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">
        Upload a photo and optionally describe it to find similar products.
      </p>
      <input
        className="mb-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        onChange={(e) => setDescriptionHint(e.target.value)}
        placeholder="Optional: blue cotton t-shirt, running shoes…"
        type="text"
        value={descriptionHint}
      />
      <input
        accept="image/*"
        className="hidden"
        onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
        ref={inputRef}
        type="file"
      />
      <Button disabled={loading} onClick={() => inputRef.current?.click()} size="sm" type="button" variant="outline">
        {loading ?
          <>
            <Loader2 aria-hidden className="mr-2 size-4 animate-spin" />
            Analyzing…
          </>
        : <>
            <Camera aria-hidden className="mr-2 size-4" />
            Upload image
          </>
        }
      </Button>

      {error ?
        <p className="mt-3 text-sm text-destructive">{error}</p>
      : null}
      {description ?
        <p className="mt-3 text-sm text-muted-foreground">{description}</p>
      : null}

      {products.length > 0 && (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {products.map((product) => (
            <li className="rounded-lg border border-border bg-background p-3" key={product.id}>
              <Link className="font-medium text-primary hover:underline" href={`/products/${product.slug}`}>
                {product.title}
              </Link>
              {product.salePrice != null ?
                <p className="text-sm text-muted-foreground">৳{product.salePrice}</p>
              : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
