'use client'

import { createUrl } from '@/utilities/createUrl'
import { SHOP_BASE_PATH } from '@/utilities/shopPath'
import { cmsPageGutterClassName } from '@/utilities/cmsLayout'
import { cn } from '@/utilities/cn'
import { ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react'

import type { ShopCategoryNavCategory } from './shopCategoryNavData'

const BAR_BG = '#051612'
const ACCENT_CLASS = 'text-[#d4a017]'

/** iPad / small tablet portrait–landscape (Tailwind md–lg), where hover flyouts clip in scroll rows and misbehave on touch. */
const TABLET_CATEGORY_NAV_MQ = '(min-width: 768px) and (max-width: 1023px)'

function useTabletCategoryNavLayout() {
  return useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === 'undefined') return () => {}
      const mql = window.matchMedia(TABLET_CATEGORY_NAV_MQ)
      mql.addEventListener('change', onStoreChange)
      return () => mql.removeEventListener('change', onStoreChange)
    },
    () => (typeof window !== 'undefined' ? window.matchMedia(TABLET_CATEGORY_NAV_MQ).matches : false),
    () => false,
  )
}

type Props = {
  categories: ShopCategoryNavCategory[]
}

export function ShopCategoryNav({ categories }: Props) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeSub = searchParams.get('sub')?.trim() ?? ''
  const querySignature = searchParams.toString()

  const isTabletLayout = useTabletCategoryNavLayout()
  const [tabletOpenId, setTabletOpenId] = useState<string | null>(null)
  const navShellRef = useRef<HTMLDivElement>(null)
  const subsPanelId = useId()

  const openCategory =
    tabletOpenId && isTabletLayout
      ? (categories.find((c) => c.id === tabletOpenId) ?? null)
      : null

  useEffect(() => {
    setTabletOpenId(null)
  }, [pathname, querySignature])

  useEffect(() => {
    if (!tabletOpenId || !isTabletLayout) return

    const close = (e: MouseEvent) => {
      if (navShellRef.current && !navShellRef.current.contains(e.target as Node)) {
        setTabletOpenId(null)
      }
    }

    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [tabletOpenId, isTabletLayout])

  if (!categories.length) {
    return null
  }

  const listWrapClass = cn(
    isTabletLayout
      ? 'min-w-0 flex-1 overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/30'
      : 'min-w-0 flex-1',
  )

  const linkRingClasses =
    'text-white/95 hover:text-[#d4a017] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a017]/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#051612]'

  return (
    <div
      ref={navShellRef}
      aria-label="Shop categories"
      className="hidden w-full md:block"
      role="navigation"
      style={{ backgroundColor: BAR_BG }}
    >
      <div
        className={cn(cmsPageGutterClassName, 'flex min-h-11 items-stretch justify-center gap-1 lg:gap-2')}
      >
        {/*
          Desktop (lg+): no horizontal scroll so hover dropdowns are not clipped.
          Tablet (md–lg): horizontal scroll + tap chevron for subcategories (see panel blow).
        */}
        <div className={listWrapClass}>
          <ul
            className={cn(
              'flex min-h-11 min-w-0 flex-1 flex-nowrap items-stretch justify-start gap-1 touch-pan-x lg:min-h-0 lg:touch-auto lg:gap-3 xl:gap-4',
              isTabletLayout && 'pb-0.5',
            )}
          >
            {categories.map((cat) => {
              const categoryPath = `${SHOP_BASE_PATH}/${cat.slug}`
              const isCategoryActive = pathname === categoryPath
              const hasSubs = cat.subcategories.length > 0
              const subsOpen = tabletOpenId === cat.id

              return (
                <li
                  className={cn(
                    'relative flex shrink-0 list-none',
                    hasSubs &&
                      !isTabletLayout &&
                      'group after:pointer-events-auto after:absolute after:left-0 after:top-full after:z-[55] after:h-3 after:w-full after:content-[\'\']',
                  )}
                  key={cat.id}
                >
                  {hasSubs && isTabletLayout ? (
                    <div className="relative z-[56] inline-flex h-full items-stretch">
                      <Link
                        href={categoryPath}
                        className={cn(
                          'inline-flex items-center whitespace-nowrap px-2 py-3 text-sm font-medium transition-colors lg:px-2.5',
                          linkRingClasses,
                          isCategoryActive && ACCENT_CLASS,
                        )}
                      >
                        <span
                          className={cn(
                            'border-b border-transparent pb-0.5',
                            isCategoryActive && 'border-[#d4a017]',
                          )}
                        >
                          {cat.title}
                        </span>
                      </Link>
                      <button
                        type="button"
                        aria-controls={subsPanelId}
                        aria-expanded={subsOpen}
                        className={cn(
                          'inline-flex min-h-11 min-w-10 shrink-0 items-center justify-center px-1 text-sm font-medium transition-colors lg:min-h-0 lg:min-w-0',
                          linkRingClasses,
                          subsOpen && ACCENT_CLASS,
                        )}
                        onClick={() => setTabletOpenId((id) => (id === cat.id ? null : cat.id))}
                      >
                        <span className="sr-only">
                          {subsOpen ? 'Hide' : 'Show'} {cat.title} subcategories
                        </span>
                        <ChevronDown
                          aria-hidden
                          className={cn(
                            'size-4 shrink-0 opacity-90 transition-transform duration-200',
                            subsOpen && 'rotate-180',
                          )}
                          strokeWidth={2}
                        />
                      </button>
                    </div>
                  ) : (
                    <Link
                      href={categoryPath}
                      className={cn(
                        'relative z-[56] inline-flex items-center gap-1 whitespace-nowrap px-2 py-3 text-sm font-medium transition-colors lg:px-2.5',
                        linkRingClasses,
                        isCategoryActive && ACCENT_CLASS,
                      )}
                    >
                      <span
                        className={cn(
                          'border-b border-transparent pb-0.5',
                          isCategoryActive && 'border-[#d4a017]',
                        )}
                      >
                        {cat.title}
                      </span>
                      {hasSubs ? (
                        <ChevronDown
                          aria-hidden
                          className="size-3.5 shrink-0 opacity-80"
                          strokeWidth={2}
                        />
                      ) : null}
                    </Link>
                  )}

                  {hasSubs && !isTabletLayout ? (
                    <div
                      className="pointer-events-none invisible absolute left-0 top-full z-[60] min-w-[12rem] pt-2 opacity-0 transition-[opacity,visibility] duration-100 group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:visible group-focus-within:opacity-100"
                      role="presentation"
                    >
                      <ul
                        className="max-h-[min(70vh,24rem)] overflow-y-auto rounded-md border border-neutral-200 bg-white py-2 shadow-lg dark:border-neutral-700 dark:bg-neutral-950"
                        role="list"
                      >
                        {cat.subcategories.map((sub) => {
                          const params = new URLSearchParams()
                          params.set('sub', sub.slug)
                          const href = createUrl(categoryPath, params)
                          const isSubActive = isCategoryActive && activeSub === sub.slug
                          return (
                            <li className="list-none" key={sub.id}>
                              <Link
                                href={href}
                                className={cn(
                                  'block px-4 py-2.5 text-sm text-neutral-900 transition-colors hover:bg-neutral-100 dark:text-neutral-100 dark:hover:bg-neutral-900',
                                  isSubActive && 'bg-neutral-100 font-medium dark:bg-neutral-900',
                                )}
                              >
                                {sub.title}
                              </Link>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  ) : null}
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      {openCategory && openCategory.subcategories.length > 0 ? (
        <div
          className="border-t border-white/15 bg-black/35"
          id={subsPanelId}
          role="region"
          aria-label={`${openCategory.title} subcategories`}
        >
          <div className={cn(cmsPageGutterClassName, 'py-3 sm:py-3.5')}>
            <ul className="flex flex-wrap gap-2 sm:gap-2.5">
              {openCategory.subcategories.map((sub) => {
                const categoryPath = `${SHOP_BASE_PATH}/${openCategory.slug}`
                const params = new URLSearchParams()
                params.set('sub', sub.slug)
                const href = createUrl(categoryPath, params)
                const isSubActive =
                  pathname === categoryPath && activeSub === sub.slug

                return (
                  <li className="list-none" key={sub.id}>
                    <Link
                      href={href}
                      className={cn(
                        'inline-flex min-h-10 items-center rounded-full border border-white/25 bg-white/10 px-3.5 py-2 text-sm font-medium text-white/95 transition-colors hover:border-[#d4a017]/60 hover:bg-white/15 hover:text-[#d4a017]',
                        isSubActive &&
                          'border-[#d4a017] bg-[#d4a017]/15 text-[#d4a017]',
                      )}
                    >
                      {sub.title}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  )
}
