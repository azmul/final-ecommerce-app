'use client'

import type { Product } from '@/payload-types'

import { Media } from '@/components/Media'
import { GridTileImage } from '@/components/Grid/tile'
import { useSearchParams } from 'next/navigation'
import React, { useEffect } from 'react'

import { Carousel, CarouselApi, CarouselContent, CarouselItem } from '@/components/ui/carousel'
import { DefaultDocumentIDType } from 'payload'

type Props = {
  gallery: NonNullable<Product['gallery']>
}

export const Gallery: React.FC<Props> = ({ gallery }) => {
  const searchParams = useSearchParams()
  const [current, setCurrent] = React.useState(0)
  const [api, setApi] = React.useState<CarouselApi>()

  useEffect(() => {
    if (!api) {
      return
    }
  }, [api])

  useEffect(() => {
    const values = Array.from(searchParams.values())

    if (values && api) {
      const index = gallery.findIndex((item) => {
        if (!item.variantOption) return false

        let variantID: DefaultDocumentIDType

        if (typeof item.variantOption === 'object') {
          variantID = item.variantOption.id
        } else variantID = item.variantOption

        return Boolean(values.find((value) => value === String(variantID)))
      })
      if (index !== -1) {
        setCurrent(index)
        api.scrollTo(index, true)
      }
    }
  }, [searchParams, api, gallery])

  return (
    <div className="flex w-full min-w-0 flex-col items-start gap-4 sm:gap-5 lg:gap-6">
      <div className="relative aspect-square w-full max-w-[min(100%,560px)] shrink-0 overflow-hidden rounded-2xl lg:mx-0 lg:max-w-none">
        <Media
          resource={gallery[current].image}
          fill
          className="absolute inset-0 block"
          imgClassName="object-contain object-top pt-0 px-2 pb-2 sm:px-4 sm:pb-4 md:px-6 md:pb-6"
          priority={current === 0}
          size="(max-width: 1024px) 100vw, 50vw"
        />
      </div>

      <Carousel
        className="w-full min-w-0"
        opts={{ align: 'start', dragFree: true, loop: false }}
        setApi={setApi}
      >
        <CarouselContent className="-mx-1 sm:-mx-1.5">
          {gallery.map((item, i) => {
            if (typeof item.image !== 'object') return null

            return (
              <CarouselItem
                className="basis-1/4 pl-2 sm:basis-1/5 sm:pl-2.5 md:basis-[18%]"
                key={`${item.image.id}-${i}`}
              >
                <button
                  type="button"
                  aria-label={`View image ${i + 1}`}
                  aria-current={i === current ? 'true' : undefined}
                  className="aspect-square w-full touch-manipulation rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  onClick={() => setCurrent(i)}
                >
                  <GridTileImage accent="brand" active={i === current} clearBackground media={item.image} />
                </button>
              </CarouselItem>
            )
          })}
        </CarouselContent>
      </Carousel>
    </div>
  )
}
