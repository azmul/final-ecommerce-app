import type { Payload } from 'payload'

export type ShopVariantOptionFacet = {
  count: number
  id: number
  label: string
  typeLabel: string
}

export async function fetchVariantOptionFacets(
  payload: Payload,
  context: { categoryId?: string },
): Promise<ShopVariantOptionFacet[]> {
  const products = await payload.find({
    collection: 'products',
    depth: 2,
    limit: 500,
    overrideAccess: false,
    pagination: false,
    select: {
      enableVariants: true,
      variantTypes: true,
      variants: true,
    },
    where: context.categoryId ?
        {
          and: [
            { _status: { equals: 'published' } },
            { categories: { contains: context.categoryId } },
          ],
        }
      : { _status: { equals: 'published' } },
  })

  const counts = new Map<number, { label: string; typeLabel: string; count: number }>()

  for (const product of products.docs) {
    if (!product.enableVariants) continue
    const variants = product.variants?.docs
    if (!Array.isArray(variants)) continue

    for (const variant of variants) {
      if (!variant || typeof variant !== 'object' || !Array.isArray(variant.options)) continue
      for (const option of variant.options) {
        if (!option || typeof option !== 'object' || typeof option.id !== 'number') continue
        const label = typeof option.label === 'string' ? option.label : String(option.id)
        const typeLabel =
          typeof option.variantType === 'object' && option.variantType && 'label' in option.variantType ?
            String((option.variantType as { label?: string }).label || 'Option')
          : 'Option'
        const existing = counts.get(option.id)
        if (existing) {
          existing.count += 1
        } else {
          counts.set(option.id, { count: 1, label, typeLabel })
        }
      }
    }
  }

  return [...counts.entries()]
    .map(([id, meta]) => ({
      count: meta.count,
      id,
      label: meta.label,
      typeLabel: meta.typeLabel,
    }))
    .sort((a, b) => a.typeLabel.localeCompare(b.typeLabel) || a.label.localeCompare(b.label))
}

export async function resolveProductIdsForVariantOptions(
  payload: Payload,
  optionIds: number[],
): Promise<number[]> {
  if (!optionIds.length) return []

  const variants = await payload.find({
    collection: 'variants',
    depth: 0,
    limit: 5000,
    overrideAccess: true,
    pagination: false,
    select: { product: true },
    where: {
      and: optionIds.map((optionId) => ({
        options: { contains: optionId },
      })),
    },
  })

  const productIds = new Set<number>()
  for (const variant of variants.docs) {
    const product = variant.product
    const productId =
      typeof product === 'number' ? product
      : typeof product === 'object' && product && 'id' in product ? (product as { id: number }).id
      : null
    if (typeof productId === 'number') productIds.add(productId)
  }

  return [...productIds]
}
