import { getPayload } from 'payload'

import {
  normalizeStaffGrants,
  parseStaffPermissionsInput,
  staffGrantsFromPermissionMap,
} from '@/lib/permissions/normalize'
import { requireFullAdminApi } from '@/lib/permissions/requireStaffPermissionApi'
import type { StaffGrantRow } from '@/lib/permissions/types'
import config from '@payload-config'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireFullAdminApi()
  if (!auth.ok) {
    return Response.json({ error: auth.message }, { status: auth.status })
  }

  const { id } = await context.params
  const payload = await getPayload({ config })

  const user = await payload.findByID({
    collection: 'users',
    id,
    depth: 0,
    overrideAccess: true,
    select: {
      roles: true,
      staffGrants: true,
      staffPermissions: true,
    },
  })

  return Response.json({
    userId: user.id,
    roles: user.roles,
    staffGrants: user.staffGrants ?? [],
    staffPermissions: user.staffPermissions ?? normalizeStaffGrants(user.staffGrants as StaffGrantRow[]),
  })
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireFullAdminApi()
  if (!auth.ok) {
    return Response.json({ error: auth.message }, { status: auth.status })
  }

  const { id } = await context.params
  const body = (await request.json()) as {
    staffGrants?: StaffGrantRow[]
    staffPermissions?: Record<string, unknown>
  }
  const staffPermissions = body.staffPermissions
    ? parseStaffPermissionsInput(body.staffPermissions)
    : normalizeStaffGrants(Array.isArray(body.staffGrants) ? body.staffGrants : [])
  const staffGrants = staffGrantsFromPermissionMap(staffPermissions)

  const payload = await getPayload({ config })

  const existing = await payload.findByID({
    collection: 'users',
    id,
    depth: 0,
    overrideAccess: true,
    select: { roles: true },
  })

  const roles = existing.roles ?? []
  if (!roles.includes('officeStaff')) {
    return Response.json(
      { error: 'User must have the officeStaff role before assigning staff permissions.' },
      { status: 400 },
    )
  }

  const updated = await payload.update({
    collection: 'users',
    id,
    data: {
      staffPermissions,
    },
    depth: 0,
    overrideAccess: true,
  })

  return Response.json({
    userId: updated.id,
    staffGrants: updated.staffGrants ?? staffGrants,
    staffPermissions: updated.staffPermissions ?? staffPermissions,
  })
}
