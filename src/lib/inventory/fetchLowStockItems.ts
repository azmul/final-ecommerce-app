import type { Payload } from 'payload'

const DEFAULT_REORDER_LEVEL = 5

export type LowStockItem = {
  id: number
  inventory: number
  kind: 'product' | 'variant'
  productId: number
  productTitle: string
  reorderLevel: number
  title: string
  variantLabel?: string
}

function resolveReorderLevel(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ?
      value
    : DEFAULT_REORDER_LEVEL
}

export async function fetchLowStockItems(payload: Payload): Promise<LowStockItem[]> {
  const [productsRes, variantsRes] = await Promise.all([
    payload.find({
      collection: 'products',
      depth: 0,
      limit: 200,
      overrideAccess: true,
      pagination: false,
      where: {
        _status: { equals: 'published' },
        enableVariants: { equals: false },
      },
      select: {
        title: true,
        inventory: true,
        reorderLevel: true,
        inventoryByLocation: true,
      },
    }),
    payload.find({
      collection: 'variants',
      depth: 1,
      limit: 300,
      overrideAccess: true,
      pagination: false,
      where: {
        _status: { equals: 'published' },
      },
      select: {
        title: true,
        inventory: true,
        reorderLevel: true,
        inventoryByLocation: true,
        product: true,
      },
    }),
  ])

  const items: LowStockItem[] = []

  for (const product of productsRes.docs) {
    const reorderLevel = resolveReorderLevel(product.reorderLevel)
    const inventory =
      Array.isArray(product.inventoryByLocation) && product.inventoryByLocation.length > 0 ?
        product.inventoryByLocation.reduce(
          (sum: number, row: { quantity?: number | null }) =>
            sum + (typeof row.quantity === 'number' ? row.quantity : 0),
          0,
        )
      : typeof product.inventory === 'number' ?
        product.inventory
      : 0

    if (inventory <= reorderLevel) {
      items.push({
        id: product.id,
        inventory,
        kind: 'product',
        productId: product.id,
        productTitle: typeof product.title === 'string' ? product.title : `Product #${product.id}`,
        reorderLevel,
        title: typeof product.title === 'string' ? product.title : `Product #${product.id}`,
      })
    }
  }

  for (const variant of variantsRes.docs) {
    const reorderLevel = resolveReorderLevel(variant.reorderLevel)
    const inventory =
      Array.isArray(variant.inventoryByLocation) && variant.inventoryByLocation.length > 0 ?
        variant.inventoryByLocation.reduce(
          (sum: number, row: { quantity?: number | null }) =>
            sum + (typeof row.quantity === 'number' ? row.quantity : 0),
          0,
        )
      : typeof variant.inventory === 'number' ?
        variant.inventory
      : 0

    if (inventory > reorderLevel) continue

    const product = variant.product
    const productId =
      typeof product === 'object' && product && 'id' in product ? Number(product.id) : 0
    const productTitle =
      typeof product === 'object' && product && typeof product.title === 'string' ?
        product.title
      : `Product #${productId || '?'}`

    items.push({
      id: variant.id,
      inventory,
      kind: 'variant',
      productId,
      productTitle,
      reorderLevel,
      title: typeof variant.title === 'string' ? variant.title : `Variant #${variant.id}`,
      variantLabel: typeof variant.title === 'string' ? variant.title : undefined,
    })
  }

  return items.sort((a, b) => a.inventory - b.inventory).slice(0, 25)
}
