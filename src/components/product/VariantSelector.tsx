'use client'

import { Button } from '@/components/ui/button'
import type { Product, Variant } from '@/payload-types'

import { createUrl } from '@/utilities/createUrl'
import clsx from 'clsx'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import React from 'react'

export function VariantSelector({ product }: { product: Product }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const variants = product.variants?.docs?.filter(
    (variant): variant is Variant => Boolean(variant && typeof variant === 'object'),
  )
  const variantTypes = product.variantTypes
  const hasVariants = Boolean(product.enableVariants && variants?.length && variantTypes?.length)

  if (!hasVariants) {
    return null
  }

  return (
    <div className="space-y-6">
      {variantTypes?.map((type) => {
    if (!type || typeof type !== 'object') {
      return <></>
    }

    const options = type.options?.docs

    if (!options || !Array.isArray(options) || !options.length) {
      return <></>
    }

    return (
      <dl className="space-y-1" key={type.id}>
        <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {type.label}
        </dt>
        <dd className="flex flex-wrap gap-2 sm:gap-2.5 pt-1">
          <React.Fragment>
            {options?.map((option) => {
              if (!option || typeof option !== 'object') {
                return <></>
              }

              const optionID = option.id
              const optionKeyLowerCase = type.name

              // Base option params on current params so we can preserve variant-related state only.
              const optionSearchParams = new URLSearchParams(searchParams.toString())

              optionSearchParams.delete('category')
              optionSearchParams.delete('sub')

              // Remove image and variant ID from this search params so we can loop over it safely.
              optionSearchParams.delete('variant')
              optionSearchParams.delete('image')

              // Update the option params using the current option to reflect how the url *would* change,
              // if the option was clicked.
              optionSearchParams.set(optionKeyLowerCase, String(optionID))

              const currentOptions = Array.from(optionSearchParams.values())

              let isAvailableForSale = true

              // Find a matching variant
              if (variants) {
                const matchingVariant = variants.find((variant) => {
                  if (!variant.options || !Array.isArray(variant.options)) return false

                  // Check if all variant options match the current options in the URL
                  return variant.options.every((variantOption) => {
                    if (!variantOption || typeof variantOption !== 'object')
                      return currentOptions.includes(String(variantOption))

                    return currentOptions.includes(String(variantOption.id))
                  })
                })

                if (matchingVariant) {
                  // If we found a matching variant, set the variant ID in the search params.
                  optionSearchParams.set('variant', String(matchingVariant.id))

                  if (matchingVariant.inventory && matchingVariant.inventory > 0) {
                    isAvailableForSale = true
                  } else {
                    isAvailableForSale = false
                  }
                }
              }

              const optionUrl = createUrl(pathname, optionSearchParams)

              // The option is active if it's in the url params.
              const isActive =
                Boolean(isAvailableForSale) &&
                searchParams.get(optionKeyLowerCase) === String(optionID)

              return (
                <Button
                  variant={'outline'}
                  aria-pressed={isActive}
                  aria-disabled={!isAvailableForSale}
                  className={clsx(
                    'h-10 min-w-11 touch-manipulation rounded-full border-2 px-3.5 text-sm font-medium transition-colors sm:h-11 sm:min-w-12 sm:px-4',
                    !isAvailableForSale && 'border-muted-foreground/30 line-through decoration-muted-foreground/50 opacity-55',
                    isAvailableForSale &&
                      (isActive
                        ? 'border-primary bg-primary/12 text-primary shadow-none hover:bg-primary/16 dark:bg-primary/18 dark:hover:bg-primary/22'
                        : 'border-border bg-transparent text-foreground hover:border-primary/50 hover:bg-muted/40 dark:hover:bg-muted/30'),
                  )}
                  disabled={!isAvailableForSale}
                  key={option.id}
                  onClick={() => {
                    router.replace(`${optionUrl}`, {
                      scroll: false,
                    })
                  }}
                  title={`${option.label} ${!isAvailableForSale ? ' (Out of Stock)' : ''}`}
                >
                  {option.label}
                </Button>
              )
            })}
          </React.Fragment>
        </dd>
      </dl>
    )
      })}
    </div>
  )
}
