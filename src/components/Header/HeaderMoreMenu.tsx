'use client'

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

function buildWhatsAppHref(phone: string | undefined): string | null {
  if (!phone?.trim()) return null

  const digits = phone.replace(/\D/g, '')
  if (!digits) return null

  const normalized =
    digits.startsWith('880') ? digits
    : digits.startsWith('01') ? `88${digits}`
    : digits

  return `https://wa.me/${normalized}`
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.884 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

export function HeaderMoreMenu({ contactPhone }: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const callHref = contactPhone ? `tel:${contactPhone.replace(/\s/g, '')}` : null
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
