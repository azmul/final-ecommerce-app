import type { PayloadRequest } from 'payload'
import { formatAdminURL } from 'payload/shared'

import { getServerSideURL } from '@/utilities/getURL'

type PasswordResetUser = {
  roles?: (string | null)[] | null
}

export type PasswordResetContext = 'admin' | 'storefront'

export function resolvePasswordResetContext(user?: PasswordResetUser | null): PasswordResetContext {
  const roles = Array.isArray(user?.roles) ? user.roles : []
  if (roles.includes('admin') || roles.includes('officeStaff')) {
    return 'admin'
  }
  return 'storefront'
}

export function resolvePasswordResetUrl(args: {
  req?: PayloadRequest
  token: string
  user?: PasswordResetUser | null
}): { context: PasswordResetContext; resetURL: string } {
  const context = resolvePasswordResetContext(args.user)
  const serverURL = getServerSideURL()

  if (context === 'admin') {
    const config = args.req?.payload?.config
    const adminRoute = config?.routes?.admin ?? '/admin'
    const resetRoute = config?.admin?.routes?.reset ?? '/reset'

    return {
      context,
      resetURL: formatAdminURL({
        adminRoute,
        path: `${resetRoute}/${args.token}`,
        serverURL,
      }),
    }
  }

  return {
    context,
    resetURL: `${serverURL}/reset-password?token=${encodeURIComponent(args.token)}`,
  }
}
