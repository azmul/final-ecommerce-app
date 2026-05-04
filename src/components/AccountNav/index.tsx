'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/utilities/cn'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

type Props = {
  className?: string
}

function normalizePathname(pathname: string | null) {
  if (!pathname) return ''
  if (pathname.length > 1 && pathname.endsWith('/')) return pathname.slice(0, -1)
  return pathname
}

export const AccountNav: React.FC<Props> = ({ className }) => {
  const pathname = normalizePathname(usePathname())

  const linkBase = 'text-primary/50 hover:text-primary hover:no-underline'
  const isAccountSettings = pathname === '/account'
  const isNotifications = pathname === '/account/notifications'
  const isAddresses = pathname === '/account/addresses'
  const isOrders = pathname === '/orders' || pathname.startsWith('/orders/')
  const isLogoutPage = pathname === '/logout'

  return (
    <div className={cn(className, 'print:hidden')}>
      <ul className="flex flex-col gap-2">
        <li>
          <Button
            asChild
            variant="link"
            className={cn(linkBase, {
              'text-primary': isAccountSettings,
            })}
          >
            <Link aria-current={isAccountSettings ? 'page' : undefined} href="/account">
              Account settings
            </Link>
          </Button>
        </li>

        <li>
          <Button
            asChild
            variant="link"
            className={cn(linkBase, {
              'text-primary': isAddresses,
            })}
          >
            <Link aria-current={isAddresses ? 'page' : undefined} href="/account/addresses">
              Addresses
            </Link>
          </Button>
        </li>

        <li>
          <Button
            asChild
            variant="link"
            className={cn(linkBase, {
              'text-primary': isOrders,
            })}
          >
            <Link aria-current={isOrders ? 'page' : undefined} href="/orders">
              Orders
            </Link>
          </Button>
        </li>

        <li>
          <Button
            asChild
            variant="link"
            className={cn(linkBase, {
              'text-primary': isNotifications,
            })}
          >
            <Link aria-current={isNotifications ? 'page' : undefined} href="/account/notifications">
              Notifications
            </Link>
          </Button>
        </li>
      </ul>

      <hr className="w-full border-white/5" />

      <Button
        asChild
        variant="link"
        className={cn(linkBase, {
          'text-primary': isLogoutPage,
        })}
      >
        <Link aria-current={isLogoutPage ? 'page' : undefined} href="/logout">
          Log out
        </Link>
      </Button>
    </div>
  )
}
