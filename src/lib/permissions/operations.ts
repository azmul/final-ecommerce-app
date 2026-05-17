import type { StaffAction } from '@/lib/permissions/types'

/** Map Payload collection/global access operations to staff actions */
export type StaffAccessOperation = 'admin' | 'create' | 'read' | 'update' | 'delete'

export function staffActionForOperation(operation: StaffAccessOperation): StaffAction {
  switch (operation) {
    case 'admin':
    case 'read':
      return 'view'
    case 'create':
      return 'create'
    case 'update':
      return 'edit'
    case 'delete':
      return 'delete'
    default:
      return 'view'
  }
}
