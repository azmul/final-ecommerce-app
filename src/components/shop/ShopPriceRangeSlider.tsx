'use client'

import {
  shopFilterAccentClass,
  shopSliderThumbClass,
  shopSliderTrackClass,
} from '@/components/shop/shopFilterStyles'
import { cn } from '@/utilities/cn'
import React, { useCallback, useEffect, useRef, useState } from 'react'

type Props = {
  className?: string
  max: number
  min: number
  onCommit: (minValue: number, maxValue: number) => void
  valueMax: number
  valueMin: number
}

function clamp(value: number, lower: number, upper: number): number {
  if (!Number.isFinite(value)) return lower
  return Math.min(Math.max(value, lower), upper)
}

export function ShopPriceRangeSlider({
  className,
  max,
  min,
  onCommit,
  valueMax,
  valueMin,
}: Props) {
  const safeMax = Math.max(max, min + 1)
  const [localMin, setLocalMin] = useState(() => clamp(valueMin, min, safeMax))
  const [localMax, setLocalMax] = useState(() => clamp(valueMax, min, safeMax))
  const [activeThumb, setActiveThumb] = useState<'min' | 'max'>('min')
  const commitTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setLocalMin(clamp(valueMin, min, safeMax))
    setLocalMax(clamp(valueMax, min, safeMax))
  }, [max, min, safeMax, valueMax, valueMin])

  useEffect(() => {
    return () => {
      if (commitTimer.current) clearTimeout(commitTimer.current)
    }
  }, [])

  const scheduleCommit = useCallback(
    (nextMin: number, nextMax: number) => {
      if (commitTimer.current) clearTimeout(commitTimer.current)
      commitTimer.current = setTimeout(() => {
        onCommit(nextMin, nextMax)
      }, 350)
    },
    [onCommit],
  )

  const range = Math.max(safeMax - min, 1)
  const minPercent = ((localMin - min) / range) * 100
  const maxPercent = ((localMax - min) / range) * 100

  const handleMinChange = (raw: number) => {
    const next = Math.min(clamp(raw, min, safeMax), localMax)
    setLocalMin(next)
    scheduleCommit(next, localMax)
  }

  const handleMaxChange = (raw: number) => {
    const next = Math.max(clamp(raw, min, safeMax), localMin)
    setLocalMax(next)
    scheduleCommit(localMin, next)
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between text-sm font-semibold text-foreground">
        <span>৳ {localMin.toLocaleString()}</span>
        <span>৳ {localMax.toLocaleString()}</span>
      </div>

      <div className="relative h-10 px-0.5 py-2">
        <div
          className={cn(
            'absolute top-1/2 h-2.5 w-full -translate-y-1/2 rounded-full',
            shopSliderTrackClass,
          )}
        />
        <div
          className={cn(
            'absolute top-1/2 h-2.5 -translate-y-1/2 rounded-full',
            shopFilterAccentClass,
          )}
          style={{
            left: `${minPercent}%`,
            right: `${100 - maxPercent}%`,
          }}
        />
        <input
          aria-label="Minimum price"
          className={cn(
            'absolute inset-0 h-10 w-full appearance-none bg-transparent',
            shopSliderThumbClass,
            activeThumb === 'min' ? 'z-30' : 'z-20',
          )}
          max={safeMax}
          min={min}
          onChange={(e) => handleMinChange(Number(e.target.value))}
          onPointerDown={() => setActiveThumb('min')}
          type="range"
          value={localMin}
        />
        <input
          aria-label="Maximum price"
          className={cn(
            'absolute inset-0 h-10 w-full appearance-none bg-transparent',
            shopSliderThumbClass,
            activeThumb === 'max' ? 'z-30' : 'z-20',
          )}
          max={safeMax}
          min={min}
          onChange={(e) => handleMaxChange(Number(e.target.value))}
          onPointerDown={() => setActiveThumb('max')}
          type="range"
          value={localMax}
        />
      </div>
    </div>
  )
}
