'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormFieldLabel } from '@/components/forms/FormFieldLabel'
import { FormItem } from '@/components/forms/FormItem'
import { Textarea } from '@/components/ui/textarea'
import {
  ORDER_CANCEL_WINDOW_HOURS,
  RETURN_REQUEST_REASONS,
  getOrderCancelDeadline,
  requestTypeLabel,
  resolveEligibleRequestTypes,
  type ReturnRequestType,
} from '@/lib/orders/returnRequestEligibility'
import type { Order } from '@/payload-types'
import { appToastError } from '@/utilities/appToast'
import { formatLocalDateTime } from '@/utilities/formatLocalDateTime'
import { PackageX, RotateCcw } from 'lucide-react'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

type ReturnRequestDoc = {
  createdAt?: string
  id: number
  requestType?: 'cancel' | 'return'
  resolutionNote?: string | null
  status?: 'pending' | 'approved' | 'rejected'
}

type OrderReturnRequestPanelProps = {
  accessToken?: string
  initialRequests: ReturnRequestDoc[]
  order: Order
}

function statusLabel(status: ReturnRequestDoc['status']): string {
  if (status === 'approved') return 'Approved'
  if (status === 'rejected') return 'Declined'
  return 'Pending review'
}

export function OrderReturnRequestPanel({
  accessToken,
  initialRequests,
  order,
}: OrderReturnRequestPanelProps) {
  const eligibleTypes = useMemo(() => resolveEligibleRequestTypes(order), [order])
  const cancelDeadline = useMemo(() => getOrderCancelDeadline(order), [order])
  const cancelWindowClosed =
    order.status === 'processing' && !eligibleTypes.includes('cancel')

  const [requests, setRequests] = useState(initialRequests)
  const [requestType, setRequestType] = useState<ReturnRequestType | ''>(
    eligibleTypes[0] ?? '',
  )
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [cancelDeadlineLabel, setCancelDeadlineLabel] = useState<string | null>(null)

  const pendingRequest = requests.find((row) => row.status === 'pending')
  const canSubmit = eligibleTypes.length > 0 && !pendingRequest && !submitted

  const querySuffix = useMemo(() => {
    const params = new URLSearchParams({ orderId: String(order.id) })
    if (accessToken) params.set('accessToken', accessToken)
    return params.toString()
  }, [accessToken, order.id])

  const refreshRequests = useCallback(async () => {
    const response = await fetch(`/api/return-requests?${querySuffix}`, {
      credentials: 'include',
    })
    if (!response.ok) return
    const body = (await response.json()) as { docs?: ReturnRequestDoc[] }
    if (Array.isArray(body.docs)) setRequests(body.docs)
  }, [querySuffix])

  useEffect(() => {
    if (!requestType && eligibleTypes[0]) {
      setRequestType(eligibleTypes[0])
    }
  }, [eligibleTypes, requestType])

  useEffect(() => {
    setReason('')
    setDetails('')
  }, [requestType])

  useEffect(() => {
    if (!cancelDeadline) {
      setCancelDeadlineLabel(null)
      return
    }

    setCancelDeadlineLabel(formatLocalDateTime(cancelDeadline))
  }, [cancelDeadline])

  async function uploadPhotos(): Promise<number[]> {
    const ids: number[] = []
    for (const file of photoFiles) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('orderId', String(order.id))
      if (accessToken) formData.append('accessToken', accessToken)

      const response = await fetch('/api/return-requests/photos', {
        body: formData,
        credentials: 'include',
        method: 'POST',
      })
      const body = (await response.json().catch(() => ({}))) as {
        error?: string
        mediaId?: number
      }
      if (!response.ok || !body.mediaId) {
        throw new Error(body.error || 'Photo upload failed.')
      }
      ids.push(body.mediaId)
    }
    return ids
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!requestType) return
    if (requestType === 'cancel' && !reason.trim()) return
    if (requestType === 'return' && !reason) return

    setLoading(true)
    try {
      const photoMediaIds = photoFiles.length ? await uploadPhotos() : []

      const response = await fetch('/api/return-requests', {
        body: JSON.stringify({
          accessToken,
          ...(requestType === 'return' ? { details } : {}),
          orderId: order.id,
          photoMediaIds,
          reason: requestType === 'cancel' ? reason.trim() : reason,
          requestType,
        }),
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })

      const body = (await response.json().catch(() => ({}))) as { error?: string }
      if (!response.ok) {
        throw new Error(body.error || 'Unable to submit request.')
      }

      setSubmitted(true)
      setPhotoFiles([])
      await refreshRequests()
      toast.success('Your request was submitted. We will email you when it is reviewed.')
    } catch (error) {
      appToastError(error, 'Unable to submit request.')
    } finally {
      setLoading(false)
    }
  }

  if (!eligibleTypes.length && !requests.length) {
    return null
  }

  return (
    <section className="rounded-lg border border-border bg-muted/15 px-4 py-5 sm:px-6">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl border bg-background text-primary">
          {eligibleTypes.includes('return') ?
            <RotateCcw aria-hidden className="size-5" />
          : <PackageX aria-hidden className="size-5" />}
        </div>
        <div>
          <h2 className="font-mono text-sm uppercase tracking-wide text-primary/70">
            Return / cancel
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Request cancellation within {ORDER_CANCEL_WINDOW_HOURS} hours of placing your order,
            or a return/refund after delivery.
          </p>
          {eligibleTypes.includes('cancel') && cancelDeadlineLabel ?
            <p className="mt-2 text-xs text-muted-foreground">
              {`Cancellation available until ${cancelDeadlineLabel}.`}
            </p>
          : null}
          {cancelWindowClosed ?
            <p className="mt-2 text-xs text-muted-foreground">
              {`The ${ORDER_CANCEL_WINDOW_HOURS}-hour cancellation window for this order has passed.`}
            </p>
          : null}
        </div>
      </div>

      {requests.length > 0 ?
        <ul className="mb-5 flex flex-col gap-3">
          {requests.map((row) => (
            <li
              key={row.id}
              className="rounded-md border border-border/80 bg-background px-4 py-3 text-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">
                  {row.requestType === 'cancel' ? 'Cancellation' : 'Return / refund'} request
                </span>
                <span
                  className={
                    row.status === 'approved' ?
                      'text-emerald-700 dark:text-emerald-300'
                    : row.status === 'rejected' ?
                      'text-destructive'
                    : 'text-amber-700 dark:text-amber-300'
                  }
                >
                  {statusLabel(row.status)}
                </span>
              </div>
              {row.status === 'rejected' && row.resolutionNote ?
                <p className="mt-2 text-muted-foreground">{row.resolutionNote}</p>
              : null}
            </li>
          ))}
        </ul>
      : null}

      {canSubmit ?
        <form className="grid gap-4" onSubmit={handleSubmit}>
          {eligibleTypes.length > 1 ?
            <FormItem>
              <FormFieldLabel htmlFor="return-request-type">Request type</FormFieldLabel>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                id="return-request-type"
                onChange={(event) => setRequestType(event.target.value as ReturnRequestType)}
                required
                value={requestType}
              >
                {eligibleTypes.map((type) => (
                  <option key={type} value={type}>
                    {requestTypeLabel(type)}
                  </option>
                ))}
              </select>
            </FormItem>
          : requestType ?
            <p className="text-sm font-medium">{requestTypeLabel(requestType)}</p>
          : null}

          <FormItem>
            <FormFieldLabel htmlFor="return-reason">
              {requestType === 'cancel' ? 'Reason for cancellation' : 'Reason'}
            </FormFieldLabel>
            {requestType === 'cancel' ?
              <Textarea
                id="return-reason"
                minLength={3}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Tell us why you want to cancel this order."
                required
                rows={4}
                value={reason}
              />
            : <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                id="return-reason"
                onChange={(event) => setReason(event.target.value)}
                required
                value={reason}
              >
                <option value="">Select a reason</option>
                {RETURN_REQUEST_REASONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            }
          </FormItem>

          {requestType === 'return' ?
            <FormItem>
              <FormFieldLabel htmlFor="return-details">Additional details</FormFieldLabel>
              <Textarea
                id="return-details"
                onChange={(event) => setDetails(event.target.value)}
                placeholder="Tell us anything that will help our team review your request."
                rows={4}
                value={details}
              />
            </FormItem>
          : null}

          {requestType === 'return' ?
            <FormItem>
              <FormFieldLabel htmlFor="return-photos">Photos (optional)</FormFieldLabel>
              <Input
                accept="image/*"
                id="return-photos"
                multiple
                onChange={(event) => {
                  const files = Array.from(event.target.files ?? []).slice(0, 3)
                  setPhotoFiles(files)
                }}
                type="file"
              />
              <p className="mt-1 text-xs text-muted-foreground">Up to 3 images, 5 MB each.</p>
            </FormItem>
          : null}

          <div>
            <Button
              disabled={
                loading ||
                !requestType ||
                (requestType === 'cancel' ? reason.trim().length < 3 : !reason)
              }
              type="submit"
            >
              {loading ? 'Submitting…' : 'Submit request'}
            </Button>
          </div>
        </form>
      : pendingRequest ?
        <p className="text-sm text-muted-foreground">
          Your request is pending review. We will notify you by email when it is updated.
        </p>
      : submitted ?
        <p className="text-sm text-muted-foreground">
          Thanks — your request was submitted successfully.
        </p>
      : null}
    </section>
  )
}
