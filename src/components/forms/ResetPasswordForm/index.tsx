'use client'

import { FormError } from '@/components/forms/FormError'
import { FormFieldLabel } from '@/components/forms/FormFieldLabel'
import { FormItem } from '@/components/forms/FormItem'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { appToastError, appToastSuccess } from '@/utilities/appToast'
import { messageFromPayloadResponse } from '@/utilities/messageFromPayloadResponse'
import { getSafeRedirectPath } from '@/utilities/safeRedirectPath'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useCallback, useRef } from 'react'
import { useForm } from 'react-hook-form'

type FormData = {
  password: string
  passwordConfirm: string
}

export const ResetPasswordForm: React.FC = () => {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')?.trim() ?? ''
  const allParams = searchParams.toString() ? `?${searchParams.toString()}` : ''
  const redirect = useRef(getSafeRedirectPath(searchParams.get('redirect')))
  const router = useRouter()

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    watch,
  } = useForm<FormData>()

  const password = useRef({})
  password.current = watch('password', '')

  const onSubmit = useCallback(
    async (data: FormData) => {
      if (!token) {
        appToastError('This reset link is invalid or has expired. Request a new one.')
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/users/reset-password`, {
        body: JSON.stringify({
          password: data.password,
          passwordConfirm: data.passwordConfirm,
          token,
        }),
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      if (response.ok) {
        appToastSuccess('Your password has been updated.')
        router.push(redirect.current || '/account')
        return
      }

      appToastError(
        await messageFromPayloadResponse(
          response,
          'This reset link is invalid or has expired. Request a new one.',
        ),
      )
    },
    [router, token],
  )

  if (!token) {
    return (
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          This reset link is missing or invalid. Request a new password reset email to continue.
        </p>
        <Button asChild size="lg" variant="default" className="w-full shadow-none sm:w-auto">
          <Link href={`/forgot-password${allParams}`}>Request a new link</Link>
        </Button>
      </div>
    )
  }

  return (
    <form className="w-full" onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-col gap-6">
        <FormItem>
          <FormFieldLabel htmlFor="password">New password</FormFieldLabel>
          <Input
            aria-describedby={errors.password ? 'reset-password-error' : undefined}
            aria-invalid={Boolean(errors.password)}
            id="password"
            autoComplete="new-password"
            {...register('password', { required: 'Password is required.' })}
            type="password"
          />
          {errors.password && <FormError id="reset-password-error" message={errors.password.message} />}
        </FormItem>

        <FormItem>
          <FormFieldLabel htmlFor="passwordConfirm">Confirm new password</FormFieldLabel>
          <Input
            aria-describedby={errors.passwordConfirm ? 'reset-passwordConfirm-error' : undefined}
            aria-invalid={Boolean(errors.passwordConfirm)}
            id="passwordConfirm"
            autoComplete="new-password"
            {...register('passwordConfirm', {
              required: 'Please confirm your password.',
              validate: (value) => value === password.current || 'The passwords do not match',
            })}
            type="password"
          />
          {errors.passwordConfirm && (
            <FormError id="reset-passwordConfirm-error" message={errors.passwordConfirm.message} />
          )}
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
          {isSubmitting ? 'Updating…' : 'Update password'}
        </Button>
        <Button asChild variant="outline" size="lg" className="w-full shadow-none sm:w-auto">
          <Link href={`/login${allParams}`}>Back to log in</Link>
        </Button>
      </div>
    </form>
  )
}
