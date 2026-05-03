import type { CollectionBeforeChangeHook } from 'payload'

function relationshipIds(ids: unknown): (number | string)[] {
  if (!Array.isArray(ids)) {
    return []
  }

  return ids
    .map((entry) =>
      typeof entry === 'object' && entry !== null && 'id' in entry && entry.id !== undefined
        ? (entry as { id: number | string }).id
        : typeof entry === 'number' || typeof entry === 'string'
          ? entry
          : null,
    )
    .filter((id): id is number | string => id !== null)
}

function parentIdFromSubDoc(parent: unknown): number | string | undefined {
  if (parent === undefined || parent === null) {
    return undefined
  }
  if (typeof parent === 'object' && parent !== null && 'id' in parent) {
    const id = (parent as { id: number | string }).id
    return id ?? undefined
  }
  if (typeof parent === 'number' || typeof parent === 'string') {
    return parent
  }
  return undefined
}

/** Ensure every subcategory’s parent category is assigned; drop subs whose parent is not allowed. */
export const syncCategoriesSubcategories: CollectionBeforeChangeHook = async ({
  data,
  req,
}) => {
  if (!req?.payload || !data) {
    return data
  }

  const typedData = data as Record<string, unknown>
  const categoryIds = new Set(relationshipIds(typedData.categories))
  const subIds = relationshipIds(typedData.subcategories)

  if (!subIds.length) {
    return data
  }

  const subResult = await req.payload.find({
    collection: 'subcategories',
    limit: subIds.length,
    overrideAccess: true,
    pagination: false,
    req,
    where: {
      id: {
        in: subIds,
      },
    },
  })

  for (const doc of subResult.docs) {
    const pid = parentIdFromSubDoc(doc.parent)
    if (pid !== undefined) {
      categoryIds.add(pid)
    }
  }

  const merged = new Set(categoryIds)
  const validSubIds: (number | string)[] = []

  for (const doc of subResult.docs) {
    const pid = parentIdFromSubDoc(doc.parent)
    if (pid === undefined || !merged.has(pid)) {
      continue
    }
    validSubIds.push(doc.id as number | string)
  }

  typedData.categories = [...merged]
  typedData.subcategories = validSubIds

  return data
}
