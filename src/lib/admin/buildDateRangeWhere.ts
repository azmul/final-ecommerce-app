import type { Where } from 'payload'

/**
 * Payload/Postgres requires separate conditions per operator — do not combine
 * `greater_than_equal` and `less_than_equal` on one field object.
 */
export function buildDateRangeWhere(
  field: 'createdAt' | 'updatedAt',
  start: string,
  end: string,
): Where {
  return {
    and: [{ [field]: { greater_than_equal: start } }, { [field]: { less_than_equal: end } }],
  }
}

export function mergeWhere(...clauses: Where[]): Where {
  const flat = clauses.flatMap((clause) => {
    if (clause && typeof clause === 'object' && 'and' in clause && Array.isArray(clause.and)) {
      return clause.and as Where[]
    }
    return [clause]
  })
  return flat.length === 1 ? flat[0]! : { and: flat }
}
