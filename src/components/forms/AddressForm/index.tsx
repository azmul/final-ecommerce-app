'use client'
import React, { useCallback, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { FormFieldLabel } from '@/components/forms/FormFieldLabel'
import { DistrictCombobox } from '@/components/forms/DistrictCombobox'
import { useAddresses } from '@payloadcms/plugin-ecommerce/client/react'
import { Address, Config } from '@/payload-types'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { FormError } from '@/components/forms/FormError'
import { FormItem } from '@/components/forms/FormItem'

type AddressFormValues = {
  district: string
  fullAddress: string
}

type Props = {
  addressID?: Config['db']['defaultIDType']
  initialData?: Partial<Pick<Address, 'district' | 'fullAddress'>>
  callback?: (data: Partial<Address>) => void
  /**
   * If true, the form will not submit to the API.
   */
  skipSubmission?: boolean
}

export const AddressForm: React.FC<Props> = ({
  addressID,
  initialData,
  callback,
  skipSubmission,
}) => {
  const [submissionError, setSubmissionError] = useState<string | null>(null)
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

  const { createAddress, updateAddress } = useAddresses()

  const onSubmit = useCallback(
    async (data: AddressFormValues) => {
      setSubmissionError(null)

      const newData: Partial<Address> = {
        district: data.district.trim(),
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
          callback(newData)
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
      <div className="flex flex-col gap-4 mb-8">
        <FormItem>
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
                aria-invalid={Boolean(errors.district)}
              />
            )}
          />
          {errors.district && <FormError message={errors.district.message} />}
        </FormItem>

        <FormItem>
          <FormFieldLabel htmlFor="fullAddress">Full address*</FormFieldLabel>
          <Textarea
            id="fullAddress"
            className="min-h-28"
            {...register('fullAddress', { required: 'Full address is required.' })}
          />
          {errors.fullAddress && <FormError message={errors.fullAddress.message} />}
        </FormItem>
      </div>

      <Button type="submit">Submit</Button>
      {submissionError ? <FormError message={submissionError} /> : null}
    </form>
  )
}
