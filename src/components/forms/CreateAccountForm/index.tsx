'use client'

import { FormError } from '@/components/forms/FormError'
import { FormItem } from '@/components/forms/FormItem'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormFieldLabel } from '@/components/forms/FormFieldLabel'
import { SocialLoginButtons } from '@/components/auth/SocialLoginButtons'
import { useAuth } from '@/providers/Auth'
import { contactToLoginEmail } from '@/utilities/contactToLoginEmail'
import { appToastError } from '@/utilities/appToast'
import { messageFromPayloadResponse } from '@/utilities/messageFromPayloadResponse'
import { getSafeRedirectPath } from '@/utilities/safeRedirectPath'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useCallback, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'

type FormData = {
  fullName: string
  email?: string
  phone: string
  password: string
  passwordConfirm: string
}

export const CreateAccountForm: React.FC = () => {
  const searchParams = useSearchParams()
  const allParams = searchParams.toString() ? `?${searchParams.toString()}` : ''
  const redirect = useRef(getSafeRedirectPath(searchParams.get('redirect')))
  const { login } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const {
    formState: { errors },
    handleSubmit,
    register,
    watch,
  } = useForm<FormData>()

  const password = useRef({})
  password.current = watch('password', '')

  const onSubmit = useCallback(
    async (data: FormData) => {
      const email = data.email?.trim() ? data.email.trim().toLowerCase() : contactToLoginEmail(data.phone)
      const body: Record<string, string> = {
        name: data.fullName.trim(),
        email,
        phone: data.phone.trim(),
        password: data.password,
        passwordConfirm: data.passwordConfirm,
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/users`, {
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      if (!response.ok) {
        appToastError(
          await messageFromPayloadResponse(
            response,
            'There was an error creating the account.',
          ),
        )
        return
      }

      const timer = setTimeout(() => {
        setLoading(true)
      }, 1000)

      try {
        await login({ email, password: data.password })
        clearTimeout(timer)

        const refCode = searchParams.get('ref')?.trim().toUpperCase()
        if (refCode) {
          await fetch('/api/referrals/apply', {
            body: JSON.stringify({ code: refCode }),
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
          }).catch(() => {})
        }

        if (redirect.current) router.push(redirect.current)
        else router.push(`/account?success=${encodeURIComponent('Account created successfully')}`)
      } catch (e) {
        clearTimeout(timer)
        appToastError(
          e,
          'There was an error with the credentials provided. Please try again.',
        )
      }
    },
    [login, router, searchParams],
  )

  return (
    <form className="w-full" onSubmit={handleSubmit(onSubmit)}>
      <SocialLoginButtons className="mb-2" redirect={redirect.current} />

      <div className="flex flex-col gap-6">
        <FormItem>
          <FormFieldLabel htmlFor="fullName">Full name</FormFieldLabel>
          <Input
            aria-describedby={errors.fullName ? 'create-fullName-error' : undefined}
            aria-invalid={Boolean(errors.fullName)}
            id="fullName"
            autoComplete="name"
            {...register('fullName', { required: 'Full name is required.' })}
            type="text"
          />
          {errors.fullName && <FormError id="create-fullName-error" message={errors.fullName.message} />}
        </FormItem>

        <FormItem>
          <FormFieldLabel htmlFor="phone">Phone number</FormFieldLabel>
          <Input
            aria-describedby={errors.phone ? 'create-phone-error' : undefined}
            aria-invalid={Boolean(errors.phone)}
            id="phone"
            autoComplete="tel"
            {...register('phone', { required: 'Phone number is required.' })}
            type="tel"
          />
          {errors.phone && <FormError id="create-phone-error" message={errors.phone.message} />}
        </FormItem>

        <FormItem>
          <FormFieldLabel htmlFor="email">
            Email <span className="font-normal text-muted-foreground">(optional)</span>
          </FormFieldLabel>
          <Input
            aria-describedby={errors.email ? 'create-email-error' : undefined}
            aria-invalid={Boolean(errors.email)}
            id="email"
            autoComplete="email"
            {...register('email')}
            type="email"
          />
          {errors.email && <FormError id="create-email-error" message={errors.email.message} />}
        </FormItem>

        <div className="relative pt-1">
          <div
            className="mb-6 flex items-center gap-3"
            role="presentation"
            aria-hidden
          >
            <div className="h-px flex-1 bg-border" />
            <span className="shrink-0 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Security
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="flex flex-col gap-6">
            <FormItem>
              <FormFieldLabel htmlFor="password">Password</FormFieldLabel>
              <Input
                aria-describedby={errors.password ? 'create-password-error' : undefined}
                aria-invalid={Boolean(errors.password)}
                id="password"
                autoComplete="new-password"
                {...register('password', { required: 'Password is required.' })}
                type="password"
              />
              {errors.password && <FormError id="create-password-error" message={errors.password.message} />}
            </FormItem>

            <FormItem>
              <FormFieldLabel htmlFor="passwordConfirm">Confirm password</FormFieldLabel>
              <Input
                aria-describedby={errors.passwordConfirm ? 'create-passwordConfirm-error' : undefined}
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
                <FormError id="create-passwordConfirm-error" message={errors.passwordConfirm.message} />
              )}
            </FormItem>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 pt-8 sm:flex-row-reverse sm:justify-between">
        <Button
          className="w-full sm:w-auto sm:min-w-40"
          disabled={loading}
          size="lg"
          type="submit"
          variant="default"
        >
          {loading ? 'Creating account…' : 'Create account'}
        </Button>
        <Button asChild variant="outline" size="lg" className="w-full shadow-none sm:w-auto">
          <Link href={`/login${allParams}`}>Already have an account? Log in</Link>
        </Button>
      </div>
    </form>
  )
}
