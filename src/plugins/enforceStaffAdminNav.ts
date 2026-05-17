import type { ClientUser, CollectionConfig, Config, GlobalConfig, Plugin } from 'payload'

import { staffHideFromAdminNavUnless } from '@/access/staffNavAccess'
import { STAFF_PAGE_REGISTRY } from '@/lib/permissions/registry'
import type { StaffPage } from '@/lib/permissions/types'

type AdminHiddenArgs = { user: ClientUser }
const COLLECTION_PAGE_ALIASES: Record<string, StaffPage> = {
  addresses: 'orders',
  variants: 'products',
}

function resolveStaffPageForCollection(slug: string): StaffPage | null {
  const alias = COLLECTION_PAGE_ALIASES[slug]
  if (alias) return alias

  const entry = Object.entries(STAFF_PAGE_REGISTRY).find(
    ([, def]) => def.collectionSlug === slug,
  )
  return entry ? (entry[0] as StaffPage) : null
}

function resolveStaffPageForGlobal(slug: string): StaffPage | null {
  const entry = Object.entries(STAFF_PAGE_REGISTRY).find(([, def]) => def.globalSlug === slug)
  return entry ? (entry[0] as StaffPage) : null
}

function mergeAdminHidden<T extends CollectionConfig | GlobalConfig>(
  entity: T,
  shouldHide: (args: AdminHiddenArgs) => boolean,
): T {
  const existingHidden = entity.admin?.hidden

  return {
    ...entity,
    admin: {
      ...entity.admin,
      hidden: (args: AdminHiddenArgs) => {
        if (shouldHide(args)) return true
        if (typeof existingHidden === 'function') {
          return (existingHidden as (args: AdminHiddenArgs) => boolean)(args)
        }
        return Boolean(existingHidden)
      },
    },
  }
}

/**
 * Hides admin nav entries for office staff unless they have view permission on the mapped page.
 * Complements access.admin / read rules so empty groups (e.g. Notifications) do not appear.
 */
export function enforceStaffAdminNavPlugin(): Plugin {
  return (incomingConfig: Config): Config => {
    const collections = incomingConfig.collections?.map((collection) => {
      const page = resolveStaffPageForCollection(collection.slug)
      if (!page) return collection

      return mergeAdminHidden(collection, staffHideFromAdminNavUnless(page))
    })

    const globals = incomingConfig.globals?.map((global) => {
      const page = resolveStaffPageForGlobal(global.slug)
      if (!page) return global

      return mergeAdminHidden(global, staffHideFromAdminNavUnless(page))
    })

    return {
      ...incomingConfig,
      collections,
      globals,
    }
  }
}
