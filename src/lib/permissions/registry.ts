import type { StaffAction, StaffPage } from '@/lib/permissions/types'

export type StaffPageDefinition = {
  label: string
  description?: string
  /** Payload collection slug when this page maps to a collection */
  collectionSlug?: string
  /** Global slug when this page maps to a global */
  globalSlug?: string
  actions: readonly StaffAction[]
  /** Custom API paths guarded by this page */
  apiRoutes?: string[]
}

/**
 * Canonical permission catalog. Each page + action pair is a logical permission row
 * (equivalent to `staff_permissions` with key `{page}:{action}`).
 */
export const STAFF_PAGE_REGISTRY: Record<StaffPage, StaffPageDefinition> = {
  pages: {
    label: 'Pages',
    collectionSlug: 'pages',
    actions: ['view', 'create', 'edit', 'delete'],
  },
  posts: {
    label: 'Blog Posts',
    collectionSlug: 'posts',
    actions: ['view', 'create', 'edit', 'delete'],
  },
  'blog-comments': {
    label: 'Blog Comments',
    collectionSlug: 'blog-comments',
    actions: ['view', 'edit', 'delete', 'approve'],
    description: 'Approve maps to moderation status updates.',
  },
  categories: {
    label: 'Categories',
    collectionSlug: 'categories',
    actions: ['view', 'create', 'edit', 'delete'],
  },
  subcategories: {
    label: 'Subcategories',
    collectionSlug: 'subcategories',
    actions: ['view', 'create', 'edit', 'delete'],
  },
  brands: {
    label: 'Brands',
    collectionSlug: 'brands',
    actions: ['view', 'create', 'edit', 'delete'],
  },
  media: {
    label: 'Media',
    collectionSlug: 'media',
    actions: ['view', 'create', 'edit', 'delete'],
  },
  forms: {
    label: 'Forms',
    collectionSlug: 'forms',
    actions: ['view', 'create', 'edit', 'delete'],
  },
  'form-submissions': {
    label: 'Form Submissions',
    collectionSlug: 'form-submissions',
    actions: ['view', 'edit', 'delete'],
  },
  products: {
    label: 'Products',
    collectionSlug: 'products',
    actions: ['view', 'create', 'edit', 'delete'],
  },
  orders: {
    label: 'Orders',
    collectionSlug: 'orders',
    actions: ['view', 'create', 'edit', 'delete', 'approve'],
    description: 'Approve allows marking orders shipped/delivered.',
    apiRoutes: ['/api/admin/orders'],
  },
  carts: {
    label: 'Carts',
    collectionSlug: 'carts',
    actions: ['view', 'edit', 'delete'],
  },
  transactions: {
    label: 'Transactions',
    collectionSlug: 'transactions',
    actions: ['view', 'edit', 'delete'],
  },
  'promo-codes': {
    label: 'Promo Codes',
    collectionSlug: 'promo-codes',
    actions: ['view', 'create', 'edit', 'delete'],
  },
  'product-reviews': {
    label: 'Product Reviews',
    collectionSlug: 'product-reviews',
    actions: ['view', 'edit', 'delete', 'approve'],
  },
  shipments: {
    label: 'Shipments',
    collectionSlug: 'shipments',
    actions: ['view', 'create', 'edit', 'delete'],
  },
  wishlists: {
    label: 'Wishlists',
    collectionSlug: 'wishlists',
    actions: ['view', 'edit', 'delete'],
  },
  users: {
    label: 'Users',
    collectionSlug: 'users',
    actions: ['view', 'create', 'edit', 'delete'],
    description:
      'Manage accounts in admin. Roles and staff permission fields remain editable by full admins only.',
  },
  'notification-preferences': {
    label: 'Notification Preferences',
    collectionSlug: 'notification-preferences',
    actions: ['view', 'edit', 'delete'],
  },
  'notification-broadcasts': {
    label: 'Notification Broadcasts',
    collectionSlug: 'notification-broadcasts',
    actions: ['view', 'create', 'edit', 'delete'],
  },
  'user-notifications': {
    label: 'User Notifications',
    collectionSlug: 'user-notifications',
    actions: ['view', 'create', 'edit', 'delete'],
  },
  'push-subscriptions': {
    label: 'Push Subscriptions',
    collectionSlug: 'push-subscriptions',
    actions: ['view', 'delete'],
  },
  'product-alerts': {
    label: 'Product Alerts',
    collectionSlug: 'product-alerts',
    actions: ['view', 'delete'],
  },
  'quote-requests': {
    label: 'Quote Requests',
    collectionSlug: 'quote-requests',
    actions: ['view', 'edit', 'delete', 'approve'],
    description: 'Approve maps to quoting / closing B2B requests.',
  },
  'return-requests': {
    label: 'Return Requests',
    collectionSlug: 'return-requests',
    actions: ['view', 'edit', 'delete', 'approve'],
    description: 'Approve or reject customer cancellation and return/refund requests.',
  },
  'loyalty-transactions': {
    label: 'Loyalty Transactions',
    collectionSlug: 'loyalty-transactions',
    actions: ['view', 'edit', 'delete'],
  },
  'recently-viewed': {
    label: 'Recently Viewed',
    collectionSlug: 'recently-viewed',
    actions: ['view', 'delete'],
  },
  'product-questions': {
    label: 'Product Questions',
    collectionSlug: 'product-questions',
    actions: ['view', 'edit', 'delete'],
    description: 'Answer pre-purchase customer questions on product pages.',
  },
  'gift-cards': {
    label: 'Gift Cards',
    collectionSlug: 'gift-cards',
    actions: ['view', 'create', 'edit', 'delete'],
  },
  'product-bundles': {
    label: 'Product Bundles',
    collectionSlug: 'product-bundles',
    actions: ['view', 'create', 'edit', 'delete'],
  },
  subscriptions: {
    label: 'Subscriptions',
    collectionSlug: 'subscriptions',
    actions: ['view', 'edit', 'delete'],
  },
  'stock-locations': {
    label: 'Stock Locations',
    collectionSlug: 'stock-locations',
    actions: ['view', 'create', 'edit', 'delete'],
  },
  'analytics-events': {
    label: 'Analytics Events',
    collectionSlug: 'analytics-events',
    actions: ['view', 'delete'],
  },
  'sales-dashboard': {
    label: 'Sales Dashboard',
    collectionSlug: 'sales-dashboard',
    actions: ['view'],
    apiRoutes: ['/api/admin/sales-dashboard'],
  },
  chat: {
    label: 'Live Chat',
    collectionSlug: 'chat-conversations',
    actions: ['view', 'edit', 'delete'],
    apiRoutes: ['/api/admin/chat'],
  },
  header: {
    label: 'Header (Global)',
    globalSlug: 'header',
    actions: ['view', 'edit'],
  },
  footer: {
    label: 'Footer (Global)',
    globalSlug: 'footer',
    actions: ['view', 'edit'],
  },
  settings: {
    label: 'Settings (Global)',
    globalSlug: 'settings',
    actions: ['view', 'edit'],
  },
}

export function getStaffPageOptions(): { label: string; value: StaffPage }[] {
  return Object.entries(STAFF_PAGE_REGISTRY).map(([value, def]) => ({
    label: def.label,
    value: value as StaffPage,
  }))
}

export function getStaffActionOptions(page: StaffPage): { label: string; value: StaffAction }[] {
  const def = STAFF_PAGE_REGISTRY[page]
  const labels: Record<StaffAction, string> = {
    view: 'View',
    create: 'Create',
    edit: 'Edit',
    delete: 'Delete',
    approve: 'Approve',
  }

  return def.actions.map((action) => ({
    label: labels[action],
    value: action,
  }))
}

export function permissionKey(page: StaffPage, action: StaffAction): string {
  return `${page}:${action}`
}

export function listAllPermissionKeys(): string[] {
  return Object.entries(STAFF_PAGE_REGISTRY).flatMap(([page, def]) =>
    def.actions.map((action) => permissionKey(page as StaffPage, action)),
  )
}
