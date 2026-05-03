import Image from 'next/image'
import React from 'react'

const LOGO_SRC =
  'https://raw.githubusercontent.com/payloadcms/payload/3.x/packages/payload/src/admin/assets/images/payload-logo-light.svg'

export const Logo = () => {
  return (
    <Image
      alt="Payload CMS"
      className="max-w-37.5 invert dark:invert-0"
      height={28}
      priority={false}
      src={LOGO_SRC}
      unoptimized
      width={100}
    />
  )
}
