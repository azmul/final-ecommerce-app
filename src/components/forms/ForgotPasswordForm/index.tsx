'use client'

import { FormError } from '@/components/forms/FormError'
import { FormItem } from '@/components/forms/FormItem'
import { Message } from '@/components/Message'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MailCheck } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import React, { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'

type FormData = {
  email: string
}

export const ForgotPasswordForm: React.FC = () => {
  const searchParams = useSearchParams()
  const allParams = searchParams.toString() ? `?${searchParams.toString()}` : ''
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<FormData>()

  const onSubmit = useCallback(async (data: FormData) => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SERVER_URL}/api/users/forgot-password`,
      {
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      },
    )

    if (response.ok) {
      setSuccess(true)
      setError('')
    } else {
      setError(
        'Something went wrong sending the reset email. Please wait a moment and try again.',
      )
    }
  }, [])

  if (success) {
    return (
      <div className="flex flex-col gap-6 sm:flex-row sm:gap-8">
        <div className="flex justify-center sm:justify-start">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
            <MailCheck aria-hidden className="h-7 w-7" strokeWidth={1.75} />
          </div>
        </div>
        <div className="min-w-0 flex-1 space-y-4 text-center sm:text-left">
          <div className="space-y-2">
            <h2 className="font-serif text-2xl tracking-tight text-foreground">Check your email</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              If there’s an account for that address, you’ll receive a message with a link to choose
              a new password. The link expires after a short time—if you don’t see it, peek in spam
              or junk.
            </p>
          </div>
          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap">
            <Button asChild size="lg" variant="default" className="w-full shadow-none sm:w-auto">
              <Link href={`/login${allParams}`}>Return to log in</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full shadow-none sm:w-auto">
              <Link href="/">Back to home</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form className="w-full" onSubmit={handleSubmit(onSubmit)}>
      <Message className="my-0! mb-6 rounded-xl border border-border/60" error={error} />

      <div className="flex flex-col gap-6">
        <FormItem>
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            autoComplete="email"
            {...register('email', { required: 'Please enter your email.' })}
            type="email"
          />
          {errors.email && <FormError message={errors.email.message} />}
        </FormItem>
      </div>

      <div className="flex flex-col gap-3 pt-8 sm:flex-row-reverse sm:justify-between">
        <Button
          className="w-full sm:w-auto sm:min-w-44"
          disabled={isSubmitting}
          size="lg"
          type="submit"
          variant="default"
        >
          {isSubmitting ? 'Sending…' : 'Send reset link'}
        </Button>
        <Button asChild variant="outline" size="lg" className="w-full shadow-none sm:w-auto">
          <Link href={`/login${allParams}`}>Back to log in</Link>
        </Button>
      </div>
    </form>
  )
}
