import { readStaffPermissionsFromUser } from '@/lib/permissions/normalize'
import { getAuthenticatedUser } from '@/lib/permissions/requireStaffPermissionApi'
import { isFullAdmin, isOfficeStaff } from '@/lib/permissions/check'

export async function GET() {
  const user = await getAuthenticatedUser()

  if (!user) {
    return Response.json({ error: 'Authentication required.' }, { status: 401 })
  }

  if (!isFullAdmin(user) && !isOfficeStaff(user)) {
    return Response.json({ error: 'Office staff or admin access required.' }, { status: 403 })
  }

  return Response.json({
    userId: user.id,
    roles: user.roles,
    isAdmin: isFullAdmin(user),
    isOfficeStaff: isOfficeStaff(user),
    staffPermissions: readStaffPermissionsFromUser(user),
  })
}
