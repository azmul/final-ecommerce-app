import { adminOrStaffOrPublished } from '@/access/adminOrStaffOrPublished'
import { staffAwarePublicRead } from '@/access/staffNavAccess'
import { adminOrStaff, staffCanViewAdminPage } from '@/access/staffAccess'
import type { StaffPage } from '@/lib/permissions/types'

/** Standard Payload collection access wired to a staff permission page */
export function staffCollectionAccess(page: StaffPage) {
  return {
    admin: staffCanViewAdminPage(page),
    create: adminOrStaff(page, 'create'),
    read: adminOrStaff(page, 'read'),
    update: adminOrStaff(page, 'update'),
    delete: adminOrStaff(page, 'delete'),
  }
}

/** Collections with draft/publish: staff view sees all docs; public sees published only */
export function staffDraftCollectionAccess(page: StaffPage) {
  return {
    ...staffCollectionAccess(page),
    read: adminOrStaffOrPublished(page),
  }
}

export function staffGlobalAccess(page: StaffPage) {
  return {
    read: adminOrStaff(page, 'read'),
    update: adminOrStaff(page, 'update'),
  }
}

/** Collection with public read; staff permissions gate admin UI and mutations */
export function staffPublicCollectionAccess(page: StaffPage) {
  return {
    admin: staffCanViewAdminPage(page),
    create: adminOrStaff(page, 'create'),
    read: staffAwarePublicRead(page),
    update: adminOrStaff(page, 'update'),
    delete: adminOrStaff(page, 'delete'),
  }
}
