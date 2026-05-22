'use client'

import { appToastFromSearchParam } from '@/utilities/appToast'
import { useSearchParams } from 'next/navigation'
import React, { useEffect, useMemo } from 'react'

export type Props = {
  className?: string
  message?: string
  onParams?: (paramValues: ((null | string | undefined) | string[])[]) => void
  params?: string[]
}

export const RenderParamsComponent: React.FC<Props> = ({
  onParams,
  params = ['error', 'warning', 'success', 'message'],
}) => {
  const searchParams = useSearchParams()
  const paramValues = params.map((param) => searchParams?.get(param))

  const alerts = useMemo(
    () =>
      params
        .map((param, index) => ({
          param,
          value: paramValues[index],
        }))
        .filter((item): item is { param: string; value: string } => Boolean(item.value)),
    [params, paramValues],
  )

  useEffect(() => {
    if (paramValues.length && onParams) {
      onParams(paramValues)
    }
  }, [paramValues, onParams])

  useEffect(() => {
    for (const { param, value } of alerts) {
      appToastFromSearchParam(param, value)
    }
  }, [alerts])

  return null
}
