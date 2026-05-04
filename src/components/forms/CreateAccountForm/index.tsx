'use client'

import { FormError } from '@/components/forms/FormError'
import { FormItem } from '@/components/forms/FormItem'
import { Message } from '@/components/Message'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/providers/Auth'
import { contactToLoginEmail } from '@/utilities/contactToLoginEmail'
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
  const { login } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<null | string>(null)

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
        const message = response.statusText || 'There was an error creating the account.'
        setError(message)
        return
      }

      const redirect = getSafeRedirectPath(searchParams.get('redirect'))

      const timer = setTimeout(() => {
        setLoading(true)
      }, 1000)

      try {
        await login({ email, password: data.password })
        clearTimeout(timer)
        if (redirect) router.push(redirect)
        else router.push(`/account?success=${encodeURIComponent('Account created successfully')}`)
      } catch (_) {
        clearTimeout(timer)
        setError('There was an error with the credentials provided. Please try again.')
      }
    },
    [login, router, searchParams],
  )

  return (
    <form className="w-full" onSubmit={handleSubmit(onSubmit)}>
      <Message className="my-0! mb-6 rounded-xl border border-border/60" error={error} />

      <div className="flex flex-col gap-6">
        <FormItem>
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            autoComplete="name"
            {...register('fullName', { required: 'Full name is required.' })}
            type="text"
          />
          {errors.fullName && <FormError message={errors.fullName.message} />}
        </FormItem>

        <FormItem>
          <Label htmlFor="phone">Phone number</Label>
          <Input
            id="phone"
            autoComplete="tel"
            {...register('phone', { required: 'Phone number is required.' })}
            type="tel"
          />
          {errors.phone && <FormError message={errors.phone.message} />}
        </FormItem>

        <FormItem>
          <Label htmlFor="email">
            Email <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input id="email" autoComplete="email" {...register('email')} type="email" />
          {errors.email && <FormError message={errors.email.message} />}
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
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                autoComplete="new-password"
                {...register('password', { required: 'Password is required.' })}
                type="password"
              />
              {errors.password && <FormError message={errors.password.message} />}
            </FormItem>

            <FormItem>
              <Label htmlFor="passwordConfirm">Confirm password</Label>
              <Input
                id="passwordConfirm"
                autoComplete="new-password"
                {...register('passwordConfirm', {
                  required: 'Please confirm your password.',
                  validate: (value) => value === password.current || 'The passwords do not match',
                })}
                type="password"
              />
              {errors.passwordConfirm && <FormError message={errors.passwordConfirm.message} />}
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
