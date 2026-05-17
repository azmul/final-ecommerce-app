/**
 * Staff permission model (maps to DB tables documented below).
 *
 * - `enum_users_roles` / `users_roles`: user ↔ role (admin | customer | officeStaff)
 * - `users_staff_grants` + `users_staff_grants_actions`: per-user page/action grants
 * - `users.staff_permissions` (json, JWT): denormalized grants for fast checks
 * - Registry in code: canonical list of pages and actions (like a `permissions` seed table)
 */

export const STAFF_ACTIONS = ['view', 'create', 'edit', 'delete', 'approve'] as const

export type StaffAction = (typeof STAFF_ACTIONS)[number]

export const STAFF_PAGES = [
  'pages',
  'posts',
  'blog-comments',
  'categories',
  'subcategories',
  'brands',
  'media',
  'forms',
  'form-submissions',
  'products',
  'orders',
  'carts',
  'transactions',
  'promo-codes',
  'product-reviews',
  'shipments',
  'wishlists',
  'users',
  'notification-preferences',
  'notification-broadcasts',
  'user-notifications',
  'push-subscriptions',
  'product-alerts',
  'sales-dashboard',
  'header',
  'footer',
] as const

export type StaffPage = (typeof STAFF_PAGES)[number]

export type StaffPermissionMap = Partial<Record<StaffPage, StaffAction[]>>

export type StaffGrantRow = {
  id?: string | null
  page: StaffPage
  actions: StaffAction[]
}

export type StaffPermissionsJWT = StaffPermissionMap
