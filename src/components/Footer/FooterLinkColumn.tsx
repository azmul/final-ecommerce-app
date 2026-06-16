import type { Footer } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import React from 'react'

type LinkColumn = NonNullable<Footer['linkColumns']>[number]

type Props = {
  column: LinkColumn
}

export function FooterLinkColumn({ column }: Props) {
  const items = column.items || []
  if (!column.title && !items.length) return null

  return (
    <nav aria-label={column.title || 'Footer links'}>
      {column.title ? (
        <h3 className="mb-4 text-sm font-semibold text-foreground">{column.title}</h3>
      ) : null}
      {items.length ? (
        <ul className="flex flex-col gap-2.5">
          {items.map((item, index) => (
            <li key={item.id ?? `${item.link.label}-${index}`}>
              <CMSLink
                {...item.link}
                appearance="inline"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              />
            </li>
          ))}
        </ul>
      ) : null}
    </nav>
  )
}
