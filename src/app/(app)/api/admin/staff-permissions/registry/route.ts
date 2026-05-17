import { listAllPermissionKeys, STAFF_PAGE_REGISTRY } from '@/lib/permissions/registry'
import { requireFullAdminApi } from '@/lib/permissions/requireStaffPermissionApi'

export async function GET() {
  const auth = await requireFullAdminApi()
  if (!auth.ok) {
    return Response.json({ error: auth.message }, { status: auth.status })
  }

  return Response.json({
    pages: STAFF_PAGE_REGISTRY,
    permissionKeys: listAllPermissionKeys(),
  })
}
