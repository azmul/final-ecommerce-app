'use client'

import { Label } from '@/components/ui/label'
import { cn } from '@/utilities/cn'
import * as React from 'react'

export function FormFieldLabel({
  className,
  ...props
}: React.ComponentProps<typeof Label>) {
  return (
    <Label
      className={cn('font-sans text-sm font-medium text-foreground', className)}
      {...props}
    />
  )
}
