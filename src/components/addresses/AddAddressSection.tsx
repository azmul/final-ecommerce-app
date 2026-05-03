'use client'

import { AddressForm } from '@/components/forms/AddressForm'
import React from 'react'

export const AddAddressSection: React.FC = () => {
  return (
    <div className="mt-10 border-t border-border pt-10">
      <h2 className="text-lg font-medium mb-6">Add a new address</h2>
      <AddressForm />
    </div>
  )
}
