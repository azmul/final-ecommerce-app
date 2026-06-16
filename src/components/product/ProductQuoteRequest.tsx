'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormFieldLabel } from '@/components/forms/FormFieldLabel'
import { FormItem } from '@/components/forms/FormItem'
import { Textarea } from '@/components/ui/textarea'
import { useAnalyticsEvent } from '@/hooks/useAnalyticsEvent'
import {
  resolveProductCategory,
  toMetaCustomDataFromProduct,
} from '@/lib/analytics/meta/productContent'
import type { Product } from '@/payload-types'
import { appToastError } from '@/utilities/appToast'
import { Building2 } from 'lucide-react'
import React, { useState } from 'react'
import { toast } from 'sonner'

type ProductQuoteRequestProps = {
  embedded?: boolean
  product: Product
}

export function ProductQuoteRequest({ embedded = false, product }: ProductQuoteRequestProps) {
  const { trackEvent } = useAnalyticsEvent()
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [companyName, setCompanyName] = useState('')
  const [contactName, setContactName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [quantity, setQuantity] = useState('10')
  const [message, setMessage] = useState('')

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/quote-requests', {
        body: JSON.stringify({
          companyName,
          contactName,
          email,
          message,
          phone,
          productId: product.id,
          quantity: Number(quantity),
        }),
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })

      const body = (await response.json().catch(() => ({}))) as { error?: string }
      if (!response.ok) {
        throw new Error(body.error || 'Unable to submit quote request.')
      }

      setSubmitted(true)
      void trackEvent({
        customData: toMetaCustomDataFromProduct({
          category: resolveProductCategory(product.categories),
          id: product.id,
          slug: product.slug,
          title: product.title,
        }),
        email,
        eventType: 'lead',
        metadata: {
          companyName,
          contactName,
          productId: product.id,
          quantity: Number(quantity),
        },
        phone,
        productId: product.id,
      })
      toast.success('Quote request submitted. Our team will contact you soon.')
    } catch (error) {
      appToastError(error, 'Unable to submit quote request.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    const success = (
      <>
        <h3 className="text-lg font-semibold">Quote request received</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Thanks — we received your bulk quote request for {product.title}. A team member will follow up by email.
        </p>
      </>
    )

    if (embedded) {
      return <div className="min-w-0 rounded-xl border border-emerald-500/30 bg-emerald-500/8 p-5">{success}</div>
    }

    return (
      <section className="rounded-2xl border border-border/70 bg-muted/20 p-6">
        {success}
      </section>
    )
  }

  const intro = (
    <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
      Ordering for a business or need a larger quantity? Send us your requirements and our team will follow up with
      pricing.
    </p>
  )

  const form = (
      <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
        <FormItem>
          <FormFieldLabel htmlFor="quote-company">Company</FormFieldLabel>
          <Input
            id="quote-company"
            onChange={(e) => setCompanyName(e.target.value)}
            required
            value={companyName}
          />
        </FormItem>
        <FormItem>
          <FormFieldLabel htmlFor="quote-contact">Contact name</FormFieldLabel>
          <Input
            id="quote-contact"
            onChange={(e) => setContactName(e.target.value)}
            required
            value={contactName}
          />
        </FormItem>
        <FormItem>
          <FormFieldLabel htmlFor="quote-email">Email</FormFieldLabel>
          <Input
            id="quote-email"
            onChange={(e) => setEmail(e.target.value)}
            required
            type="email"
            value={email}
          />
        </FormItem>
        <FormItem>
          <FormFieldLabel htmlFor="quote-phone">Phone</FormFieldLabel>
          <Input
            id="quote-phone"
            onChange={(e) => setPhone(e.target.value)}
            type="tel"
            value={phone}
          />
        </FormItem>
        <FormItem className="sm:col-span-1">
          <FormFieldLabel htmlFor="quote-quantity">Quantity</FormFieldLabel>
          <Input
            id="quote-quantity"
            min={1}
            onChange={(e) => setQuantity(e.target.value)}
            required
            type="number"
            value={quantity}
          />
        </FormItem>
        <FormItem className="sm:col-span-2">
          <FormFieldLabel htmlFor="quote-message">Requirements</FormFieldLabel>
          <Textarea
            id="quote-message"
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us about delivery timeline, variants, or pricing needs."
            rows={4}
            value={message}
          />
        </FormItem>
        <div className="sm:col-span-2">
          <Button disabled={loading} size="lg" type="submit">
            {loading ? 'Submitting…' : 'Request quote'}
          </Button>
        </div>
      </form>
  )

  if (embedded) {
    return (
      <div className="min-w-0">
        {intro}
        {form}
      </div>
    )
  }

  return (
    <section className="rounded-2xl border border-border/70 bg-muted/15 p-6">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl border bg-background text-primary">
          <Building2 aria-hidden className="size-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Request a bulk quote</h2>
          <p className="text-sm text-muted-foreground">
            Ordering for a business or need a larger quantity? Send us your requirements.
          </p>
        </div>
      </div>
      {form}
    </section>
  )
}
