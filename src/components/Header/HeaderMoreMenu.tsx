'use client'

import { buildTelHref, buildWhatsAppHref } from '@/lib/contact/phoneLinks'
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon'
import { cn } from '@/utilities/cn'
import {
  BadgeHelp,
  Contact,
  Heart,
  Menu,
  Phone,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

type Props = {
  contactPhone?: string
}

type MoreMenuItem =
  | {
      external?: false
      href: string
      icon: React.ReactNode
      label: string
    }
  | {
      external: true
      href: string
      icon: React.ReactNode
      label: string
    }

export function HeaderMoreMenu({ contactPhone }: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const callHref = buildTelHref(contactPhone)
  const whatsAppHref = buildWhatsAppHref(contactPhone)

  const items: MoreMenuItem[] = [
    {
      href: '/about',
      icon: <Contact aria-hidden className="size-[18px] shrink-0" strokeWidth={1.75} />,
      label: 'About Us',
    },
    {
      href: '/wishlist',
      icon: <Heart aria-hidden className="size-[18px] shrink-0" strokeWidth={1.75} />,
      label: 'Wishlists',
    },
    {
      href: '/faq',
      icon: <BadgeHelp aria-hidden className="size-[18px] shrink-0" strokeWidth={1.75} />,
      label: 'Faqs',
    },
    ...(callHref
      ? [
          {
            external: true,
            href: callHref,
            icon: <Phone aria-hidden className="size-[18px] shrink-0" strokeWidth={1.75} />,
            label: 'Call Us',
          } satisfies MoreMenuItem,
        ]
      : []),
    ...(whatsAppHref
      ? [
          {
            external: true,
            href: whatsAppHref,
            icon: <WhatsAppIcon className="size-[18px] shrink-0 text-[#25D366]" />,
            label: 'WhatsApp',
          } satisfies MoreMenuItem,
        ]
      : []),
  ]

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    window.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div className="relative" ref={rootRef}>
      <button
        aria-controls="header-more-menu"
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          'flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium leading-none transition-colors',
          open ? 'text-primary' : 'text-foreground hover:text-primary',
        )}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <Menu aria-hidden className="size-5" strokeWidth={1.75} />
        <span>More</span>
      </button>

      {open ? (
        <div
          className="absolute right-0 top-[calc(100%+0.25rem)] z-50 min-w-[11.5rem] overflow-hidden rounded-md border border-border bg-background shadow-md"
          id="header-more-menu"
          role="menu"
        >
          <ul className="divide-y divide-border">
            {items.map((item) => (
              <li key={item.label} role="none">
                {item.external ? (
                  <a
                    className="flex min-h-11 items-center gap-3 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-muted/60"
                    href={item.href}
                    onClick={() => setOpen(false)}
                    rel={item.label === 'WhatsApp' ? 'noopener noreferrer' : undefined}
                    role="menuitem"
                    target={item.label === 'WhatsApp' ? '_blank' : undefined}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </a>
                ) : (
                  <Link
                    className="flex min-h-11 items-center gap-3 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-muted/60"
                    href={item.href}
                    onClick={() => setOpen(false)}
                    role="menuitem"
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
