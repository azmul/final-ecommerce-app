'use client'

import type { ReactNode } from 'react'
import {
  EmailIcon,
  EmailShareButton,
  FacebookIcon,
  FacebookMessengerIcon,
  FacebookMessengerShareButton,
  FacebookShareButton,
  LineIcon,
  LineShareButton,
  LinkedinIcon,
  LinkedinShareButton,
  PinterestIcon,
  PinterestShareButton,
  TelegramIcon,
  TelegramShareButton,
  TwitterIcon,
  TwitterShareButton,
  WhatsappIcon,
  WhatsappShareButton,
} from 'next-share'

import { cn } from '@/utilities/cn'

const ICON_SIZE = 40

export type SocialShareRowProps = {
  className?: string
  headingClassName?: string
  summary?: string
  title: string
  /** Absolute URL of a representative image (Pinterest and richer previews). */
  imageUrl?: string
  url: string
}

function IconWrap({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 rounded-full ring-1 ring-border/60 shadow-sm transition hover:opacity-95 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background',
        className,
      )}
    >
      {children}
    </span>
  )
}

export function SocialShareRow({
  className,
  headingClassName,
  imageUrl,
  summary,
  title,
  url,
}: SocialShareRowProps) {
  const fbAppId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID ?? ''
  const pinMedia = imageUrl ?? url

  const lineTitle = summary ? `${title} — ${summary}` : title
  const emailBody = summary ? `${summary}\n\n` : ''

  return (
    <section
      aria-label="Share this page"
      className={cn('space-y-3', className)}
    >
      <h2 className={cn('text-xs font-semibold uppercase tracking-wide text-muted-foreground', headingClassName)}>
        Share
      </h2>
      <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
        <IconWrap>
          <FacebookShareButton {...(summary ? { quote: summary } : {})} resetButtonStyle url={url}>
            <FacebookIcon round size={ICON_SIZE} />
          </FacebookShareButton>
        </IconWrap>

        <IconWrap>
          <LineShareButton title={lineTitle} url={url} resetButtonStyle>
            <LineIcon round size={ICON_SIZE} />
          </LineShareButton>
        </IconWrap>

        <IconWrap>
          <PinterestShareButton description={summary ?? title} media={pinMedia} url={url} resetButtonStyle>
            <PinterestIcon round size={ICON_SIZE} />
          </PinterestShareButton>
        </IconWrap>

        <IconWrap>
          <TelegramShareButton title={title} url={url} resetButtonStyle>
            <TelegramIcon round size={ICON_SIZE} />
          </TelegramShareButton>
        </IconWrap>

        <IconWrap>
          <TwitterShareButton title={title} url={url} resetButtonStyle>
            <TwitterIcon round size={ICON_SIZE} />
          </TwitterShareButton>
        </IconWrap>

        <IconWrap>
          <WhatsappShareButton separator=" — " title={title} url={url} resetButtonStyle>
            <WhatsappIcon round size={ICON_SIZE} />
          </WhatsappShareButton>
        </IconWrap>

        <IconWrap>
          <LinkedinShareButton summary={summary} title={title} url={url} resetButtonStyle>
            <LinkedinIcon round size={ICON_SIZE} />
          </LinkedinShareButton>
        </IconWrap>

        {fbAppId ?
          <IconWrap>
            <FacebookMessengerShareButton appId={fbAppId} redirectUri={url} url={url} resetButtonStyle>
              <FacebookMessengerIcon round size={ICON_SIZE} />
            </FacebookMessengerShareButton>
          </IconWrap>
        : <IconWrap className="opacity-55">
            <button
              aria-disabled="true"
              aria-label="Messenger share requires NEXT_PUBLIC_FACEBOOK_APP_ID in environment variables"
              className="cursor-not-allowed border-0 bg-transparent p-0"
              disabled
              title="Add NEXT_PUBLIC_FACEBOOK_APP_ID to enable Messenger share"
              type="button"
            >
              <FacebookMessengerIcon round size={ICON_SIZE} />
            </button>
          </IconWrap>
        }

        <IconWrap>
          <EmailShareButton body={emailBody} subject={title} url={url} resetButtonStyle>
            <EmailIcon round size={ICON_SIZE} />
          </EmailShareButton>
        </IconWrap>
      </div>
    </section>
  )
}
