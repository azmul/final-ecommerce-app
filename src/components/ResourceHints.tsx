type LcpImagePreloadProps = {
  href?: string | null
}

/** Preload the likely LCP image so the browser discovers it before layout paint. */
export function LcpImagePreload({ href }: LcpImagePreloadProps) {
  if (!href) return null

  return <link as="image" fetchPriority="high" href={href} rel="preload" />
}

type PreconnectHintProps = {
  href?: string | null
}

/** Warm connection to media CDN / asset host when configured. */
export function PreconnectHint({ href }: PreconnectHintProps) {
  if (!href) return null

  try {
    const { origin } = new URL(href)
    if (!origin || origin === 'null') return null

    return (
      <>
        <link crossOrigin="anonymous" href={origin} rel="preconnect" />
        <link href={origin} rel="dns-prefetch" />
      </>
    )
  } catch {
    return null
  }
}
