import type { Access, Where } from 'payload'

/**
 * Combines access checkers with OR semantics (matches plugin-ecommerce accessOR).
 * Returns true if any checker grants full access; otherwise merges Where constraints.
 */
export function accessOr(...checkers: Access[]): Access {
  return async (args) => {
    const whereQueries: Where[] = []

    for (const checker of checkers) {
      const result = await checker(args)
      if (result === true) {
        return true
      }
      if (result && typeof result === 'object') {
        whereQueries.push(result)
      }
    }

    if (whereQueries.length === 0) {
      return false
    }

    if (whereQueries.length === 1) {
      return whereQueries[0]
    }

    return { or: whereQueries }
  }
}
