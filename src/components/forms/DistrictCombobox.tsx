'use client'

import { BANGLADESH_DISTRICTS, filterDistricts, matchDistrictInput } from '@/constants/bangladeshDistricts'
import { cn } from '@/utilities/cn'
import { Input } from '@/components/ui/input'
import { ChevronDownIcon } from 'lucide-react'
import React, { useCallback, useEffect, useId, useRef, useState } from 'react'

type Props = {
  id?: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  onInputValueChange?: (value: string) => void
  disabled?: boolean
  'aria-invalid'?: boolean
  inputClassName?: string
  placeholder?: string
}

export const DistrictCombobox: React.FC<Props> = ({
  id,
  value,
  onChange,
  onBlur,
  onInputValueChange,
  disabled,
  'aria-invalid': ariaInvalid,
  inputClassName,
  placeholder = 'Search or select district…',
}) => {
  const listId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const queryRef = useRef('')
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(value || '')

  queryRef.current = query

  useEffect(() => {
    if (!open) {
      setQuery(value || '')
    }
  }, [value, open])

  const commitAndClose = useCallback(() => {
    const trimmed = queryRef.current.trim()
    const match = matchDistrictInput(trimmed)
    if (match) {
      onChange(match)
      setQuery(match)
    } else if (!trimmed) {
      onChange('')
      setQuery('')
    } else {
      setQuery(value || '')
    }
    setOpen(false)
  }, [onChange, value])

  useEffect(() => {
    if (!open) return
    const onDocMouseDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        commitAndClose()
      }
    }
    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [open, commitAndClose])

  const filtered = filterDistricts(query)
  const inList = (s: string) =>
    (BANGLADESH_DISTRICTS as readonly string[]).includes(s)
  const showLegacyValue =
    Boolean(value && !inList(value)) &&
    (!query.trim() || value.toLowerCase().includes(query.trim().toLowerCase()))

  const options = showLegacyValue && value ? [value, ...filtered.filter((d) => d !== value)] : filtered

  const handleOpen = () => {
    if (disabled) return
    setOpen(true)
    setQuery(value || '')
  }

  const selectDistrict = (district: string) => {
    onChange(district)
    setQuery(district)
    onInputValueChange?.(district)
    setOpen(false)
    onBlur?.()
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Input
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          disabled={disabled}
          aria-invalid={ariaInvalid}
          placeholder={placeholder}
          className={cn('pr-9', inputClassName)}
          value={open ? query : value}
          onFocus={handleOpen}
          onChange={(e) => {
            const next = e.target.value
            setQuery(next)
            onInputValueChange?.(next)
            setOpen(true)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const match = matchDistrictInput(queryRef.current)
              if (match) {
                e.preventDefault()
                selectDistrict(match)
              }
            }
          }}
          onBlur={() => {
            onBlur?.()
            commitAndClose()
          }}
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          className="text-muted-foreground absolute top-1/2 right-1.5 -translate-y-1/2 rounded p-1 hover:bg-muted disabled:opacity-50"
          aria-label={open ? 'Close district list' : 'Open district list'}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            if (open) {
              commitAndClose()
            } else {
              handleOpen()
            }
          }}
        >
          <ChevronDownIcon className={cn('size-4 transition-transform', open && 'rotate-180')} />
        </button>
      </div>
      {open && !disabled ? (
        <ul
          id={listId}
          role="listbox"
          className="bg-popover text-popover-foreground border-input absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border py-1 shadow-md"
        >
          {options.length === 0 ? (
            <li className="text-muted-foreground px-3 py-2 text-sm">No district matches.</li>
          ) : (
            options.map((district) => (
              <li key={district} role="option" aria-selected={district === value}>
                <button
                  type="button"
                  className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground w-full px-3 py-2 text-left text-sm outline-none"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    selectDistrict(district)
                  }}
                >
                  {district}
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  )
}
