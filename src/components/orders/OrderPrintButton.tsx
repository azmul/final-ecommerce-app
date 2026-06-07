'use client'

import { PrinterIcon } from 'lucide-react'
import { useCallback } from 'react'

import { Button } from '@/components/ui/button'

const BODY_CLASS = 'order-detail-printing'

export const OrderPrintButton = () => {
  const handlePrint = useCallback(() => {
    document.body.classList.add(BODY_CLASS)

    let cleanedUp = false

    const cleanup = () => {
      if (cleanedUp) return
      cleanedUp = true
      document.body.classList.remove(BODY_CLASS)
      window.removeEventListener('afterprint', onAfterPrint)
      window.clearTimeout(fallbackTimer)
    }

    const onAfterPrint = () => {
      cleanup()
    }

    window.addEventListener('afterprint', onAfterPrint)
    const fallbackTimer = window.setTimeout(cleanup, 5000)

    window.print()
  }, [])

  return (
    <Button
      className="print:hidden shrink-0 text-sm sm:text-base"
      onClick={handlePrint}
      type="button"
      variant="outline"
    >
      <PrinterIcon className="size-4 sm:size-4.5" />
      <span className="sm:hidden">Print</span>
      <span className="hidden sm:inline">Print / Save PDF</span>
    </Button>
  )
}
