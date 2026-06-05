import type { Brand, Category, Product, Subcategory, Variant, VariantOption } from '@/payload-types'

function lexicalToPlainText(value: Product['description']): string {
  if (!value?.root?.children) return ''

  const parts: string[] = []

  const walk = (nodes: unknown[]) => {
    for (const node of nodes) {
      if (!node || typeof node !== 'object') continue
      const n = node as { type?: string; text?: string; children?: unknown[] }
      if (n.type === 'text' && typeof n.text === 'string') {
        parts.push(n.text)
      }
      if (Array.isArray(n.children)) {
        walk(n.children)
      }
    }
  }

  walk(value.root.children)
  return parts.join(' ').trim()
}

function relationTitle(value: unknown): string | null {
  if (typeof value === 'object' && value && 'title' in value) {
    const title = (value as { title?: string }).title
    return typeof title === 'string' ? title : null
  }
  return null
}

export function buildProductSearchDocument(product: Product, variants: Variant[] = []): string {
  const chunks: string[] = [product.title]

  const description = lexicalToPlainText(product.description)
  if (description) chunks.push(description)

  if (product.seoContent?.aiSummary) chunks.push(product.seoContent.aiSummary)
  if (product.seoContent?.whyChooseThis) chunks.push(product.seoContent.whyChooseThis)
  if (product.seoContent?.usageInfo) chunks.push(product.seoContent.usageInfo)

  for (const feature of product.seoContent?.keyFeatures ?? []) {
    if (feature.feature) chunks.push(feature.feature)
  }

  for (const spec of product.technicalSpecs ?? []) {
    chunks.push(`${spec.label} ${spec.value}`)
  }

  if (product.meta?.description) chunks.push(product.meta.description)

  const brandTitle = relationTitle(product.brand)
  if (brandTitle) chunks.push(brandTitle)

  for (const category of product.categories ?? []) {
    const title = relationTitle(category)
    if (title) chunks.push(title)
  }

  for (const subcategory of product.subcategories ?? []) {
    const title = relationTitle(subcategory)
    if (title) chunks.push(title)
  }

  for (const variant of variants) {
    for (const option of variant.options ?? []) {
      if (typeof option === 'object' && option) {
        const opt = option as VariantOption
        chunks.push(opt.label, opt.value)
        if (typeof opt.variantType === 'object' && opt.variantType) {
          chunks.push(opt.variantType.label, opt.variantType.name)
        }
      }
    }
  }

  return chunks.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
}

export function extractProductAttributes(product: Product, variants: Variant[] = []) {
  const colors = new Set<string>()
  const sizes = new Set<string>()
  const materials = new Set<string>()

  for (const spec of product.technicalSpecs ?? []) {
    const label = spec.label.toLowerCase()
    if (label.includes('material')) {
      materials.add(spec.value)
    }
  }

  for (const variant of variants) {
    for (const option of variant.options ?? []) {
      if (typeof option !== 'object' || !option) continue
      const opt = option as VariantOption
      const typeName =
        typeof opt.variantType === 'object' && opt.variantType
          ? `${opt.variantType.label} ${opt.variantType.name}`.toLowerCase()
          : ''

      if (typeName.includes('color') || typeName.includes('colour')) {
        colors.add(opt.label)
      } else if (typeName.includes('size')) {
        sizes.add(opt.label)
      } else if (typeName.includes('material')) {
        materials.add(opt.label)
      }
    }
  }

  const categories = (product.categories ?? [])
    .map((item) => relationTitle(item))
    .filter((v): v is string => Boolean(v))

  const subcategories = (product.subcategories ?? [])
    .map((item) => relationTitle(item as Category | Subcategory))
    .filter((v): v is string => Boolean(v))

  return {
    brand: relationTitle(product.brand as Brand | number | null | undefined),
    categories: [...categories, ...subcategories],
    colors: [...colors],
    materials: [...materials],
    sizes: [...sizes],
  }
}
