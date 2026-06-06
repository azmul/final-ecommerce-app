'use client'

import { FormFieldLabel } from '@/components/forms/FormFieldLabel'
import { FormItem } from '@/components/forms/FormItem'
import {
  GUEST_PHONE_COUNTRIES,
  GUEST_PHONE_COUNTRY_OPTIONS,
  type GuestPhoneCountry,
} from '@/lib/phone/guestPhoneCountries'
import { cn } from '@/utilities/cn'
import { ChevronDown } from 'lucide-react'
import React from 'react'

type Props = {
  country: GuestPhoneCountry
  disabled?: boolean
  error?: string | null
  id?: string
  name?: string
  onCountryChange: (country: GuestPhoneCountry) => void
  onValueChange: (value: string) => void
  value: string
}

export const GuestPhoneField: React.FC<Props> = ({
  country,
  disabled,
  error,
  id = 'guestPhone',
  name = 'guestPhone',
  onCountryChange,
  onValueChange,
  value,
}) => {
  const config = GUEST_PHONE_COUNTRIES[country]
  const countrySelectId = `${id}-country`

  return (
    <FormItem className="gap-3">
      <FormFieldLabel className="text-base sm:text-sm" htmlFor={id}>
        Phone number
      </FormFieldLabel>

      <div
        className={cn(
          'flex h-12 w-full items-stretch overflow-hidden rounded-md border bg-background shadow-xs transition-[color,box-shadow]',
          error ?
            'border-destructive'
          : 'border-input focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50',
          disabled && 'opacity-50',
        )}
      >
        <div className="relative flex shrink-0 items-center border-r border-input bg-muted/40">
          <label className="sr-only" htmlFor={countrySelectId}>
            Country code
          </label>
          <select
            className="h-full w-[5.75rem] cursor-pointer appearance-none bg-transparent py-0 pr-8 pl-3 text-base font-semibold tabular-nums text-foreground outline-none disabled:cursor-not-allowed sm:w-[6rem] sm:text-sm"
            disabled={disabled}
            id={countrySelectId}
            onChange={(e) => {
              onCountryChange(e.target.value as GuestPhoneCountry)
            }}
            title={config.label}
            value={country}
          >
            {GUEST_PHONE_COUNTRY_OPTIONS.map((option) => (
              <option key={option.code} title={option.label} value={option.code}>
                {option.dialCode}
              </option>
            ))}
          </select>
          <ChevronDown
            aria-hidden
            className="pointer-events-none absolute top-1/2 right-2 size-4 -translate-y-1/2 text-muted-foreground"
          />
        </div>

        <input
          aria-describedby={error ? `${id}-error` : `${id}-hint`}
          aria-invalid={Boolean(error)}
          autoComplete="tel-national"
          className="min-w-0 flex-1 bg-transparent px-3 text-base outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed sm:px-3 sm:text-sm"
          disabled={disabled}
          id={id}
          inputMode="numeric"
          name={name}
          onChange={(e) => onValueChange(e.target.value)}
          placeholder={config.localPlaceholder}
          required
          type="tel"
          value={value}
        />
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground" id={`${id}-hint`}>
        <span className="font-medium text-foreground/80">{config.label}</span>
        {' · '}
        {country === 'BD' ?
          'Enter mobile without +880 (e.g. 01712345678).'
        : 'Enter mobile without +91 (10 digits).'}
      </p>

      {error ?
        <p className="text-sm text-destructive" id={`${id}-error`} role="alert">
          {error}
        </p>
      : null}
    </FormItem>
  )
}
