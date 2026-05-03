'use client'

import { Category } from '@/payload-types'
import { cn } from '@/utilities/cn'
import { ChevronDown } from 'lucide-react'
import { usePathname } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'

import { CategoryItem } from './Categories.client'

const panelId = 'shop-sidebar-categories'

export function CategoriesSection({ categories }: { categories: Category[] }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const prevPathRef = useRef<string | null>(null)

  useEffect(() => {
    const prev = prevPathRef.current
    prevPathRef.current = pathname
    if (prev !== null && prev !== pathname) {
      setOpen(false)
    }
  }, [pathname])

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        className="flex min-h-11 w-full items-center justify-between gap-2 rounded-lg px-1 py-1.5 text-left transition hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background xl:hidden"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-sm font-semibold text-foreground">Categories</span>
        <ChevronDown
          aria-hidden
          className={cn(
            'size-4 shrink-0 text-muted-foreground transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>
      <h3 className="mb-3 hidden text-sm font-semibold text-foreground xl:block">Categories</h3>
      <ul
        id={panelId}
        className={cn(
          'flex flex-col gap-0.5',
          open ? 'block' : 'max-xl:hidden',
          'xl:block',
        )}
        role="list"
      >
        {categories.map((category) => (
          <li className="list-none" key={category.id}>
            <CategoryItem category={category} />
          </li>
        ))}
      </ul>
    </div>
  )
}
