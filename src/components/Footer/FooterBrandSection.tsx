import type { Footer, Media } from '@/payload-types'

import { LogoIcon } from '@/components/icons/logo'
import { cn } from '@/utilities/cn'
import { Mail, MapPin, Phone } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

type Props = {
  footer: Footer
  siteName: string
}

function resolveMediaUrl(logo: Footer['logo']): string | null {
  if (!logo || typeof logo !== 'object') return null
  const media = logo as Media
  return typeof media.url === 'string' ? media.url : null
}

function FacebookIcon() {
  return (
    <svg aria-hidden className="size-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
    </svg>
  )
}

function TwitterIcon() {
  return (
    <svg aria-hidden className="size-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg aria-hidden className="size-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  )
}

function SocialButton({
  href,
  label,
  children,
}: {
  children: React.ReactNode
  href: string
  label: string
}) {
  return (
    <a
      aria-label={label}
      className="flex size-9 items-center justify-center rounded-full bg-orange-50 text-orange-500 transition-colors hover:bg-orange-100 hover:text-orange-600"
      href={href}
      rel="noopener noreferrer"
      target="_blank"
    >
      {children}
    </a>
  )
}

function GooglePlayBadge() {
  return (
    <svg aria-hidden className="h-10 w-auto" viewBox="0 0 135 40" xmlns="http://www.w3.org/2000/svg">
      <rect fill="#000" height="40" rx="5" width="135" />
      <text fill="#fff" fontFamily="system-ui, sans-serif" fontSize="8" x="42" y="14">
        GET IT ON
      </text>
      <text fill="#fff" fontFamily="system-ui, sans-serif" fontSize="13" fontWeight="600" x="42" y="28">
        Google Play
      </text>
      <path
        d="M9 8.5 22.5 20 9 31.5c-.4-.2-.7-.7-.7-1.3V9.8c0-.6.3-1.1.7-1.3Z"
        fill="#32BBFF"
      />
      <path d="M9 8.5 22.5 20 9 20V8.5Z" fill="#00C853" />
      <path d="M9 20 22.5 20 9 31.5V20Z" fill="#FFD500" />
      <path d="M22.5 20 9 31.5 24 26.5 22.5 20Z" fill="#FF3A44" />
    </svg>
  )
}

function AppStoreBadge() {
  return (
    <svg aria-hidden className="h-10 w-auto" viewBox="0 0 135 40" xmlns="http://www.w3.org/2000/svg">
      <rect fill="#fff" height="38" rx="5" stroke="#ddd" strokeWidth="1" width="133" x="1" y="1" />
      <text fill="#000" fontFamily="system-ui, sans-serif" fontSize="8" x="42" y="14">
        Download on the
      </text>
      <text fill="#000" fontFamily="system-ui, sans-serif" fontSize="13" fontWeight="600" x="42" y="28">
        App Store
      </text>
      <path
        d="M18.5 28.5c-.3 0-.6-.1-.8-.3-.5-.4-.5-1.2-.1-2.1.4-.9 1.2-1.9 2-2.5.8-.6 1.5-.8 2-.5.5.3.5 1.1.1 2-.4.9-1.2 1.9-2 2.5-.4.3-.8.5-1.2.5Zm-1.2-9.8c.2-.5.8-.7 1.4-.5.6.2 1.2.8 1.5 1.5.3.7.1 1.3-.4 1.5-.5.2-1.1-.1-1.7-.7-.6-.6-1-1.3-.8-1.8Z"
        fill="#000"
      />
    </svg>
  )
}

export function FooterBrandSection({ footer, siteName }: Props) {
  const logoUrl = resolveMediaUrl(footer.logo)
  const social = footer.socialLinks
  const apps = footer.appLinks
  const currentYear = new Date().getFullYear()
  const copyrightDate = `2023${currentYear > 2023 ? `-${currentYear}` : ''}`
  const copyrightLine =
    footer.copyrightText?.trim() ||
    `© ${copyrightDate} ${siteName}. All rights reserved.`

  return (
    <div className="flex flex-col gap-6 lg:max-w-sm">
      <Link className="inline-flex items-center gap-2.5" href="/">
        {logoUrl ? (
          <Image
            alt={siteName}
            className="h-10 w-auto object-contain"
            height={40}
            src={logoUrl}
            unoptimized
            width={160}
          />
        ) : (
          <>
            <LogoIcon className="size-8 text-orange-500" aria-hidden />
            <span className="text-lg font-bold uppercase tracking-wide text-orange-500">{siteName}</span>
          </>
        )}
      </Link>

      {footer.description ? (
        <p className="text-sm leading-relaxed text-muted-foreground">{footer.description}</p>
      ) : null}

      <ul className="flex flex-col gap-3 text-sm text-muted-foreground">
        {footer.address ? (
          <li className="flex items-start gap-2.5">
            <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground/70" />
            <span>{footer.address}</span>
          </li>
        ) : null}
        {footer.phone ? (
          <li className="flex items-center gap-2.5">
            <Phone aria-hidden className="size-4 shrink-0 text-muted-foreground/70" />
            <a className="hover:text-foreground" href={`tel:${footer.phone.replace(/\s/g, '')}`}>
              {footer.phone}
            </a>
          </li>
        ) : null}
        {footer.email ? (
          <li className="flex items-center gap-2.5">
            <Mail aria-hidden className="size-4 shrink-0 text-muted-foreground/70" />
            <a className="hover:text-foreground" href={`mailto:${footer.email}`}>
              {footer.email}
            </a>
          </li>
        ) : null}
      </ul>

      {social?.facebook || social?.twitter || social?.instagram ? (
        <div className="flex items-center gap-2.5">
          {social.facebook ? (
            <SocialButton href={social.facebook} label="Facebook">
              <FacebookIcon />
            </SocialButton>
          ) : null}
          {social.twitter ? (
            <SocialButton href={social.twitter} label="Twitter">
              <TwitterIcon />
            </SocialButton>
          ) : null}
          {social.instagram ? (
            <SocialButton href={social.instagram} label="Instagram">
              <InstagramIcon />
            </SocialButton>
          ) : null}
        </div>
      ) : null}

      {apps?.googlePlay || apps?.appStore ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-foreground">Download App on Mobile :</p>
          <div className="flex flex-wrap items-center gap-3">
            {apps.googlePlay ? (
              <a aria-label="Get it on Google Play" href={apps.googlePlay} rel="noopener noreferrer" target="_blank">
                <GooglePlayBadge />
              </a>
            ) : null}
            {apps.appStore ? (
              <a aria-label="Download on the App Store" href={apps.appStore} rel="noopener noreferrer" target="_blank">
                <AppStoreBadge />
              </a>
            ) : null}
          </div>
        </div>
      ) : null}

      <p className={cn('text-xs text-muted-foreground/80 lg:hidden')}>{copyrightLine}</p>
    </div>
  )
}
