'use client'

import { shouldForceFullPageNavigation } from '@/utilities/publicFullPageNavigation'
import { useEffect } from 'react'

export function PublicFullPageNavigation() {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey
      ) {
        return
      }

      if (!(event.target instanceof Element)) return

      const anchor = event.target.closest('a[href]')
      if (!(anchor instanceof HTMLAnchorElement)) return
      if (anchor.dataset.clientNavigation === 'true') return
      if (anchor.hasAttribute('download')) return
      if (anchor.target && anchor.target !== '_self') return

      if (
        !shouldForceFullPageNavigation({
          currentHref: window.location.href,
          href: anchor.href,
        })
      ) {
        return
      }

      event.preventDefault()
      event.stopImmediatePropagation()
      window.location.assign(anchor.href)
    }

    document.addEventListener('click', handleClick, { capture: true })

    return () => document.removeEventListener('click', handleClick, { capture: true })
  }, [])

  return null
}
