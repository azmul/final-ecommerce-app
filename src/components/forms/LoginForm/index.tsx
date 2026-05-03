'use client'

import { FormError } from '@/components/forms/FormError'
import { FormItem } from '@/components/forms/FormItem'
import { Message } from '@/components/Message'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/providers/Auth'
import { contactToLoginEmail, isValidEmailOrPhone } from '@/utilities/contactToLoginEmail'
import Link from 'next/link'
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
  const redirect = useRef(searchParams.get('redirect'))
  const { login } = useAuth()
  const router = useRouter()
  const [error, setError] = React.useState<null | string>(null)

  const {
    formState: { errors, isLoading },
    handleSubmit,
    register,
  } = useForm<FormData>()

  const onSubmit = useCallback(
    async (data: FormData) => {
      try {
        await login({
          email: contactToLoginEmail(data.email),
          password: data.password,
        })
        if (redirect?.current) router.push(redirect.current)
        else router.push('/account')
      } catch (_) {
        setError('There was an error with the credentials provided. Please try again.')
      }
    },
    [login, router],
  )

  return (
    <form className="" onSubmit={handleSubmit(onSubmit)}>
      <Message className="my-0! mb-6 rounded-xl border border-border/60" error={error} />
      <div className="flex flex-col gap-6">
        <FormItem>
          <Label htmlFor="email">Email or phone number</Label>
          <Input
            id="email"
            type="text"
            autoComplete="username"
            {...register('email', {
              required: 'Email or phone number is required.',
              validate: (value) =>
                isValidEmailOrPhone(value) || 'Enter a valid email address or phone number.',
            })}
          />
          {errors.email && <FormError message={errors.email.message} />}
        </FormItem>

        <FormItem>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            {...register('password', { required: 'Please provide a password.' })}
          />
          {errors.password && <FormError message={errors.password.message} />}
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
          disabled={isLoading}
          size="lg"
          type="submit"
          variant="default"
        >
          {isLoading ? 'Signing in…' : 'Continue'}
        </Button>
        <Button asChild variant="outline" size="lg" className="w-full shadow-none sm:w-auto">
          <Link href={`/create-account${allParams}`}>Create an account</Link>
        </Button>
      </div>
    </form>
  )
}
