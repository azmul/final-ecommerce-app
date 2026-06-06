'use client'
import React, { useCallback, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { FormFieldLabel } from '@/components/forms/FormFieldLabel'
import { DistrictCombobox } from '@/components/forms/DistrictCombobox'
import { useAuth } from '@/providers/Auth'
import { useAddresses, useEcommerce } from '@payloadcms/plugin-ecommerce/client/react'
import { Address, Config } from '@/payload-types'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { FormError } from '@/components/forms/FormError'
import { FormItem } from '@/components/forms/FormItem'
import { matchDistrictInput } from '@/constants/bangladeshDistricts'
import { cn } from '@/utilities/cn'

type AddressFormValues = {
  district: string
  fullAddress: string
}

type Props = {
  addressID?: Config['db']['defaultIDType']
  comfortable?: boolean
  initialData?: Partial<Pick<Address, 'district' | 'fullAddress'>>
  callback?: (data: Partial<Address>) => void
  /**
   * If true, the form will not submit to the API.
   */
  skipSubmission?: boolean
}

const comfortableInputClass =
  'h-12 px-4 text-base sm:h-10 sm:px-3 sm:text-sm'
const comfortableTextareaClass =
  'min-h-32 px-4 py-3 text-base sm:min-h-28 sm:px-3 sm:py-2 sm:text-sm'

export const AddressForm: React.FC<Props> = ({
  addressID,
  comfortable = false,
  initialData,
  callback,
  skipSubmission,
}) => {
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const districtInputRef = useRef(initialData?.district ?? '')
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AddressFormValues>({
    defaultValues: {
      district: initialData?.district ?? '',
      fullAddress: initialData?.fullAddress ?? '',
    },
  })

  const { user: authUser } = useAuth()
  const { user: ecommerceUser } = useEcommerce()
  const { createAddress, updateAddress } = useAddresses()

  const sessionSyncing = Boolean(!skipSubmission && authUser?.id && !ecommerceUser?.id)

  const onSubmit = useCallback(
    async (data: AddressFormValues) => {
      setSubmissionError(null)

      const resolvedDistrict =
        matchDistrictInput(data.district) ?? matchDistrictInput(districtInputRef.current) ?? ''

      if (!resolvedDistrict) {
        setSubmissionError('Please select a valid district from the list.')
        return
      }

      const newData: Partial<Address> = {
        district: resolvedDistrict,
        fullAddress: data.fullAddress.trim(),
      }

      try {
        if (!skipSubmission) {
          if (addressID) {
            await updateAddress(addressID, newData)
          } else {
            await createAddress(newData)
          }
        }

        if (callback) {
          callback(addressID ? { ...newData, id: addressID } : newData)
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unable to save address. Please try again.'
        setSubmissionError(message)
      }
    },
    [skipSubmission, callback, addressID, updateAddress, createAddress],
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div
        className={cn(
          'mb-8 flex flex-col',
          comfortable ? 'gap-6' : 'gap-4',
        )}
      >
        <FormItem className={comfortable ? 'gap-3' : undefined}>
          <FormFieldLabel htmlFor="district">District*</FormFieldLabel>
          <Controller
            name="district"
            control={control}
            rules={{ required: 'District is required.' }}
            render={({ field }) => (
              <DistrictCombobox
                id="district"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                onInputValueChange={(value) => {
                  districtInputRef.current = value
                }}
                aria-invalid={Boolean(errors.district)}
                inputClassName={comfortable ? comfortableInputClass : undefined}
              />
            )}
          />
          {errors.district && <FormError message={errors.district.message} />}
        </FormItem>

        <FormItem className={comfortable ? 'gap-3' : undefined}>
          <FormFieldLabel htmlFor="fullAddress">Full address*</FormFieldLabel>
          <Textarea
            id="fullAddress"
            className={comfortable ? comfortableTextareaClass : 'min-h-28'}
            {...register('fullAddress', { required: 'Full address is required.' })}
          />
          {errors.fullAddress && <FormError message={errors.fullAddress.message} />}
        </FormItem>
      </div>

      <Button
        className={comfortable ? 'min-h-12 w-full text-base sm:min-h-10 sm:w-auto sm:text-sm' : undefined}
        disabled={sessionSyncing}
        type="submit"
      >
        {sessionSyncing ? 'Preparing your account…' : 'Save address'}
      </Button>
      {sessionSyncing ?
        <p className="text-sm text-muted-foreground">Connecting your session. This only takes a moment.</p>
      : null}
      {submissionError ? <FormError message={submissionError} /> : null}
    </form>
  )
}
