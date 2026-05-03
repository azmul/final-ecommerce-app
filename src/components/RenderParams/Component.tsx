'use client'

import clsx from 'clsx'
import { useSearchParams } from 'next/navigation'
import React, { useEffect } from 'react'

import { Message } from '../Message'

export type Props = {
  className?: string
  message?: string
  onParams?: (paramValues: ((null | string | undefined) | string[])[]) => void
  params?: string[]
}

export const RenderParamsComponent: React.FC<Props> = ({
  className,
  onParams,
  params = ['error', 'warning', 'success', 'message'],
}) => {
  const searchParams = useSearchParams()
  const paramValues = params.map((param) => searchParams?.get(param))

  useEffect(() => {
    if (paramValues.length && onParams) {
      onParams(paramValues)
    }
  }, [paramValues, onParams])

  const alerts = params
    .map((param, index) => ({
      param,
      value: paramValues[index],
    }))
    .filter((item): item is { param: string; value: string } => Boolean(item.value))

  if (alerts.length === 0) {
    return null
  }

  return (
    <div className={clsx('flex flex-col gap-3', className)}>
      {alerts.map(({ param, value }) => (
        <Message
          key={`${param}:${value}`}
          className="my-0! rounded-xl border border-border/60"
          {...{
            [param]: value,
          }}
        />
      ))}
    </div>
  )
}
