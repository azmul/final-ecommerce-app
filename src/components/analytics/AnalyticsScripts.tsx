import Script from 'next/script'
import type { ReactNode } from 'react'

const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID

/**
 * Loads GA4 gtag + Meta Pixel bootstrap.
 * Meta PageView + route transitions are handled by `MetaPixelProvider`.
 * Server-side events use Conversions API (`/api/analytics/meta`, `/api/analytics/purchase`).
 */
export function AnalyticsScripts(): ReactNode {
  if (!gaId && !pixelId) return null

  return (
    <>
      {gaId ?
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="lazyOnload"
          />
          <Script id="store-gtag-init" strategy="lazyOnload">
            {`
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${gaId}', { send_page_view: true });
`}
          </Script>
        </>
      : null}

      {pixelId ?
        <Script id="store-meta-pixel" strategy="lazyOnload">
          {`
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixelId}');
`}
        </Script>
      : null}
    </>
  )
}
