'use client'

import { FormError } from '@/components/forms/FormError'
import { FormItem } from '@/components/forms/FormItem'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormFieldLabel } from '@/components/forms/FormFieldLabel'
import { useAuth } from '@/providers/Auth'
import { isValidEmailOrPhone } from '@/utilities/contactToLoginEmail'
import { appToastError } from '@/utilities/appToast'
import { getSafeRedirectPath } from '@/utilities/safeRedirectPath'
import Link from 'next/link'
import { SocialLoginButtons } from '@/components/auth/SocialLoginButtons'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { useCallback, useRef } from 'react'
import { useForm } from 'react-hook-form'

type FormData = {
  email: string
  password: string
}

export const LoginForm: React.FC = () => {
  const searchParams = useSearchParams()
  const allParams = searchParams.toString() ? `?${searchParams.toString()}` : ''
  const redirect = useRef(getSafeRedirectPath(searchParams.get('redirect')))
  const { login } = useAuth()
  const router = useRouter()
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<FormData>()

  const onSubmit = useCallback(
    async (data: FormData) => {
      try {
        await login({
          email: data.email.trim(),
          password: data.password,
        })
        if (redirect?.current) {
          router.push(redirect.current)
        } else {
          router.push('/account')
        }
      } catch (e) {
        appToastError(
          e,
          'There was an error with the credentials provided. Please try again.',
        )
      }
    },
    [login, router],
  )

  return (
    <form className="" onSubmit={handleSubmit(onSubmit)}>
      <SocialLoginButtons className="mb-2" redirect={redirect.current} />

      <div className="flex flex-col gap-6">
        <FormItem>
          <FormFieldLabel htmlFor="email">Email or phone number</FormFieldLabel>
          <Input
            aria-describedby={errors.email ? 'login-email-error' : undefined}
            aria-invalid={Boolean(errors.email)}
            id="email"
            type="text"
            autoComplete="username"
            {...register('email', {
              required: 'Email or phone number is required.',
              validate: (value) =>
                isValidEmailOrPhone(value) || 'Enter a valid email address or phone number.',
            })}
          />
          {errors.email && <FormError id="login-email-error" message={errors.email.message} />}
        </FormItem>

        <FormItem>
          <FormFieldLabel htmlFor="password">Password</FormFieldLabel>
          <Input
            aria-describedby={errors.password ? 'login-password-error' : undefined}
            aria-invalid={Boolean(errors.password)}
            id="password"
            type="password"
            {...register('password', { required: 'Please provide a password.' })}
          />
          {errors.password && <FormError id="login-password-error" message={errors.password.message} />}
        </FormItem>

        <p className="text-sm text-muted-foreground">
          Forgot your password?{' '}
          <Link
            href={`/forgot-password${allParams}`}
            className="font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
          >
            Reset it
          </Link>
        </p>
      </div>

      <div className="flex flex-col gap-3 pt-2 sm:flex-row-reverse sm:justify-between">
        <Button
          className="w-full sm:w-auto sm:min-w-36"
          disabled={isSubmitting}
          size="lg"
          type="submit"
          variant="default"
        >
          {isSubmitting ? 'Signing in…' : 'Continue'}
        </Button>
        <Button asChild variant="outline" size="lg" className="w-full shadow-none sm:w-auto">
          <Link href={`/create-account${allParams}`}>Create an account</Link>
        </Button>
      </div>
    </form>
  )
}
