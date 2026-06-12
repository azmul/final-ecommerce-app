import type { Media as MediaType } from '@/payload-types'

import { Media } from '@/components/Media'
import { Label } from '@/components/Grid/Label'
import clsx from 'clsx'
import React from 'react'

type Props = {
  active?: boolean
  /** PDP gallery thumbs use primary accent; grids keep default blue. */
  accent?: 'default' | 'brand'
  /** Omit tile frame when nested inside another bordered card (e.g. related products). */
  borderless?: boolean
  /** No solid fill behind the image (e.g. PDP gallery thumbnails). */
  clearBackground?: boolean
  isInteractive?: boolean
  label?: {
    amount: number
    position?: 'bottom' | 'center'
    title: string
  }
  media: MediaType
  priority?: boolean
  size?: string
}

export const GridTileImage: React.FC<Props> = ({
  active,
  accent = 'default',
  borderless = false,
  clearBackground = false,
  isInteractive = true,
  label,
  priority,
  size,
  ...props
}) => {
  const isBrand = accent === 'brand'

  return (
    <div
      className={clsx(
        'group flex h-full w-full items-center justify-center overflow-hidden',
        clearBackground ? 'bg-transparent' : 'bg-white dark:bg-black',
        borderless
          ? clsx('rounded-xl border-0', { relative: Boolean(label) })
          : clsx('rounded-lg border', {
              relative: label,
              'border-neutral-200 hover:border-blue-600 dark:border-neutral-800': !isBrand && !active,
              'border-2 border-blue-600': !isBrand && active,
              'border-neutral-200 hover:border-primary/80 dark:border-neutral-800 dark:hover:border-primary/60':
                isBrand && !active,
              'border-2 border-primary shadow-sm ring-2 ring-primary/25 dark:ring-primary/20':
                isBrand && active,
            }),
      )}
    >
      {props.media ? (
        <Media
          alt={props.media.alt?.trim() || label?.title || 'Product image'}
          className={clsx('relative h-full w-full object-cover', {
            'transition duration-300 ease-in-out group-hover:scale-105': isInteractive,
          })}
          height={80}
          imgClassName="h-full w-full object-cover"
          priority={priority}
          resource={props.media}
          size={size}
          width={80}
        />
      ) : null}
      {label ? <Label amount={label.amount} position={label.position} title={label.title} /> : null}
    </div>
  )
}
