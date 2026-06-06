'use client'
import { Button } from '@/components/ui/button'
import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { AddressForm } from '@/components/forms/AddressForm'
import { Address } from '@/payload-types'
import { cn } from '@/utilities/cn'
import { DefaultDocumentIDType } from 'payload'

type Props = {
  addressID?: DefaultDocumentIDType
  initialData?: Partial<Address>
  buttonText?: string
  comfortableForm?: boolean
  dialogContentClassName?: string
  modalTitle?: string
  callback?: (address: Partial<Address>) => void
  skipSubmission?: boolean
  disabled?: boolean
  triggerClassName?: string
}

export const CreateAddressModal: React.FC<Props> = ({
  addressID,
  initialData,
  buttonText = 'Add a new address',
  comfortableForm = false,
  dialogContentClassName,
  modalTitle = 'Add a new address',
  callback,
  skipSubmission,
  disabled,
  triggerClassName,
}) => {
  const [open, setOpen] = useState(false)
  const handleOpenChange = (state: boolean) => {
    setOpen(state)
  }

  const closeModal = () => {
    setOpen(false)
  }

  const handleCallback = (data: Partial<Address>) => {
    closeModal()

    if (callback) {
      callback(data)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild disabled={disabled}>
        <Button className={triggerClassName} variant="outline">
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent
        className={cn(
          'max-w-[calc(100%-1rem)] gap-5 p-4 sm:max-w-lg sm:gap-4 sm:p-6',
          dialogContentClassName,
        )}
      >
        <DialogHeader>
          <DialogTitle>{modalTitle}</DialogTitle>
          <DialogDescription>
            {skipSubmission ?
              'Enter where we should deliver your order.'
            : 'This address will be connected to your account.'}
          </DialogDescription>
        </DialogHeader>

        <AddressForm
          addressID={addressID}
          comfortable={comfortableForm}
          initialData={initialData}
          callback={handleCallback}
          skipSubmission={skipSubmission}
        />
      </DialogContent>
    </Dialog>
  )
}
