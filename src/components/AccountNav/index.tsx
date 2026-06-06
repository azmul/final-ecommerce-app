'use client'

import { Button } from '@/components/ui/button'
import { accountTabHref, type AccountTabId } from '@/lib/account/accountTabs'
import { useStaffPermissions } from '@/hooks/useStaffPermissions'
import { cn } from '@/utilities/cn'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

type Props = {
  className?: string
  orientation?: 'vertical' | 'horizontal'
}

function normalizePathname(pathname: string | null) {
  if (!pathname) return ''
  if (pathname.length > 1 && pathname.endsWith('/')) return pathname.slice(0, -1)
  return pathname
}

function isAccountTabActive(args: {
  pathname: string
  searchParams: URLSearchParams
  tab: AccountTabId
}): boolean {
  if (args.pathname !== '/account') {
    if (args.tab === 'orders') {
      return args.pathname === '/orders' || args.pathname.startsWith('/orders/')
    }
    return false
  }

  const currentTab = args.searchParams.get('tab')
  if (args.tab === 'profile') {
    return !currentTab || currentTab === 'profile'
  }

  return currentTab === args.tab
}

export const AccountNav: React.FC<Props> = ({ className, orientation = 'vertical' }) => {
  const pathname = normalizePathname(usePathname())
  const searchParams = useSearchParams()
  const isHorizontal = orientation === 'horizontal'
  const { can } = useStaffPermissions()
  const canViewSupport = can('chat', 'view')

  const linkBase = 'text-primary/50 hover:text-primary hover:no-underline'
  const isSupport = pathname === '/admin/support'
  const isLogoutPage = pathname === '/logout'

  const navLinks = (
    <>
      <li>
        <Button
          asChild
          variant="link"
          className={cn(linkBase, {
            'text-primary': isAccountTabActive({ pathname, searchParams, tab: 'profile' }),
          })}
        >
          <Link
            aria-current={
              isAccountTabActive({ pathname, searchParams, tab: 'profile' }) ? 'page' : undefined
            }
            href={accountTabHref('profile')}
          >
            Account settings
          </Link>
        </Button>
      </li>

      <li>
        <Button
          asChild
          variant="link"
          className={cn(linkBase, {
            'text-primary': isAccountTabActive({ pathname, searchParams, tab: 'addresses' }),
          })}
        >
          <Link
            aria-current={
              isAccountTabActive({ pathname, searchParams, tab: 'addresses' }) ? 'page' : undefined
            }
            href={accountTabHref('addresses')}
          >
            Addresses
          </Link>
        </Button>
      </li>

      <li>
        <Button
          asChild
          variant="link"
          className={cn(linkBase, {
            'text-primary': isAccountTabActive({ pathname, searchParams, tab: 'orders' }),
          })}
        >
          <Link
            aria-current={
              isAccountTabActive({ pathname, searchParams, tab: 'orders' }) ? 'page' : undefined
            }
            href={accountTabHref('orders')}
          >
            Orders
          </Link>
        </Button>
      </li>

      <li>
        <Button
          asChild
          variant="link"
          className={cn(linkBase, {
            'text-primary': isAccountTabActive({ pathname, searchParams, tab: 'notifications' }),
          })}
        >
          <Link
            aria-current={
              isAccountTabActive({ pathname, searchParams, tab: 'notifications' }) ?
                'page'
              : undefined
            }
            href={accountTabHref('notifications')}
          >
            Notifications
          </Link>
        </Button>
      </li>

      <li>
        <Button
          asChild
          variant="link"
          className={cn(linkBase, {
            'text-primary': isAccountTabActive({ pathname, searchParams, tab: 'rewards' }),
          })}
        >
          <Link
            aria-current={
              isAccountTabActive({ pathname, searchParams, tab: 'rewards' }) ? 'page' : undefined
            }
            href={accountTabHref('rewards')}
          >
            Rewards
          </Link>
        </Button>
      </li>

      {canViewSupport ?
        <li>
          <Button
            asChild
            variant="link"
            className={cn(linkBase, {
              'text-primary': isSupport,
            })}
          >
            <Link aria-current={isSupport ? 'page' : undefined} href="/admin/support">
              Support inbox
            </Link>
          </Button>
        </li>
      : null}
    </>
  )

  if (isHorizontal) {
    return (
      <nav
        aria-label="Account"
        className={cn(
          className,
          'print:hidden -mx-1 flex gap-1 overflow-x-auto overscroll-x-contain pb-1',
        )}
      >
        <ul className="flex min-w-max gap-1">{navLinks}</ul>
      </nav>
    )
  }

  return (
    <div className={cn(className, 'print:hidden')}>
      <ul className="flex flex-col gap-2">{navLinks}</ul>

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
