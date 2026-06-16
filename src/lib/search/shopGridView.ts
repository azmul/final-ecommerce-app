export type ShopGridView = 'comfortable' | 'compact' | 'default'

export function shopGridClassName(view?: ShopGridView): string {
  switch (view) {
    case 'compact':
      return 'grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5 xl:grid-cols-5'
    case 'comfortable':
      return 'grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6'
    default:
      return 'grid grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4'
  }
}

export const shopViewOptions: { label: string; value: ShopGridView }[] = [
  { label: 'Default', value: 'default' },
  { label: 'Compact', value: 'compact' },
  { label: 'Comfortable', value: 'comfortable' },
]
