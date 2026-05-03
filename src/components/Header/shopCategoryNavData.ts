import configPromise from '@payload-config'
import { getPayload } from 'payload'

export type ShopCategoryNavSub = {
  id: string
  title: string
  slug: string
}

export type ShopCategoryNavCategory = {
  id: string
  title: string
  slug: string
  subcategories: ShopCategoryNavSub[]
}

function parentIdFromRelation(parent: unknown): string | null {
  if (parent == null) return null
  if (typeof parent === 'number' || typeof parent === 'string') return String(parent)
  if (typeof parent === 'object' && 'id' in parent) return String((parent as { id: unknown }).id)
  return null
}

export async function getShopCategoryNavData(): Promise<ShopCategoryNavCategory[]> {
  const payload = await getPayload({ config: configPromise })

  const [cats, subs] = await Promise.all([
    payload.find({
      collection: 'categories',
      limit: 200,
      overrideAccess: false,
      pagination: false,
      select: {
        title: true,
        slug: true,
      },
      sort: 'title',
    }),
    payload.find({
      collection: 'subcategories',
      limit: 500,
      overrideAccess: false,
      pagination: false,
      select: {
        title: true,
        slug: true,
        parent: true,
      },
      sort: 'title',
    }),
  ])

  const subsByParent = new Map<string, ShopCategoryNavSub[]>()
  for (const doc of subs.docs) {
    const slug = typeof doc.slug === 'string' ? doc.slug : ''
    if (!slug) continue
    const pid = parentIdFromRelation(doc.parent)
    if (!pid) continue
    const entry: ShopCategoryNavSub = {
      id: String(doc.id),
      title: typeof doc.title === 'string' ? doc.title : '',
      slug,
    }
    const list = subsByParent.get(pid) ?? []
    list.push(entry)
    subsByParent.set(pid, list)
  }

  return cats.docs
    .map((c): ShopCategoryNavCategory | null => {
      const slug = typeof c.slug === 'string' ? c.slug : ''
      if (!slug) return null
      return {
        id: String(c.id),
        title: typeof c.title === 'string' ? c.title : '',
        slug,
        subcategories: subsByParent.get(String(c.id)) ?? [],
      }
    })
    .filter((c): c is ShopCategoryNavCategory => c !== null)
}
