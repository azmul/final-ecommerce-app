'use client'

import { useField, useFormFields } from '@payloadcms/ui'
import React, { useMemo } from 'react'

import { getStaffPageOptions, STAFF_PAGE_REGISTRY } from '@/lib/permissions/registry'
import type { StaffAction, StaffPage, StaffPermissionMap } from '@/lib/permissions/types'

import './index.scss'

const baseClass = 'staff-permissions-field'

function toPermissionMap(value: unknown): StaffPermissionMap {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }
  return value as StaffPermissionMap
}

export function StaffPermissionsField() {
  const { value, setValue } = useField<StaffPermissionMap>({ path: 'staffPermissions' })
  const roles = useFormFields(([fields]) => fields.roles?.value) as string[] | undefined

  const isOfficeStaff = Array.isArray(roles) && roles.includes('officeStaff')
  const permissionMap = useMemo(() => toPermissionMap(value), [value])

  if (!isOfficeStaff) {
    return (
      <p className={`${baseClass}__hint`}>
        Assign the <strong>officeStaff</strong> role to configure page and action permissions.
      </p>
    )
  }

  const commitMap = (next: StaffPermissionMap) => {
    setValue(next)
  }

  const toggleAction = (page: StaffPage, action: StaffAction, enabled: boolean) => {
    const current = new Set(permissionMap[page] ?? [])

    if (enabled) {
      current.add(action)
    } else {
      current.delete(action)
    }

    const next = { ...permissionMap }

    if (current.size === 0) {
      delete next[page]
    } else {
      next[page] = [...current]
    }

    commitMap(next)
  }

  const toggleAllForPage = (page: StaffPage, enabled: boolean) => {
    const next = { ...permissionMap }

    if (enabled) {
      next[page] = [...STAFF_PAGE_REGISTRY[page].actions]
    } else {
      delete next[page]
    }

    commitMap(next)
  }

  return (
    <div className={baseClass}>
      <p className={`${baseClass}__hint`}>
        Toggle which admin pages this user can access and which actions they may perform. Changes
        take effect on save.
      </p>
      <div className={`${baseClass}__table-wrap`}>
        <table className={`${baseClass}__table`}>
          <thead>
            <tr>
              <th scope="col">Page</th>
              <th scope="col">All</th>
              {(['view', 'create', 'edit', 'delete', 'approve'] as const).map((action) => (
                <th key={action} scope="col">
                  {action.charAt(0).toUpperCase() + action.slice(1)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {getStaffPageOptions().map(({ label, value: page }) => {
              const def = STAFF_PAGE_REGISTRY[page]
              const pageActions = new Set(permissionMap[page] ?? [])
              const allChecked = def.actions.every((a) => pageActions.has(a))

              return (
                <tr key={page}>
                  <th scope="row">
                    <span className={`${baseClass}__page-label`}>{label}</span>
                    {def.description ? (
                      <span className={`${baseClass}__page-desc`}>{def.description}</span>
                    ) : null}
                  </th>
                  <td>
                    <input
                      aria-label={`All actions for ${label}`}
                      checked={allChecked}
                      onChange={(e) => toggleAllForPage(page, e.target.checked)}
                      type="checkbox"
                    />
                  </td>
                  {(['view', 'create', 'edit', 'delete', 'approve'] as const).map((action) => {
                    const available = def.actions.includes(action)
                    return (
                      <td key={action}>
                        {available ? (
                          <input
                            aria-label={`${action} on ${label}`}
                            checked={pageActions.has(action)}
                            onChange={(e) => toggleAction(page, action, e.target.checked)}
                            type="checkbox"
                          />
                        ) : (
                          <span className={`${baseClass}__na`}>—</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
