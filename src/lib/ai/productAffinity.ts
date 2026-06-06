import { sql } from '@payloadcms/db-postgres'
import { getPostgresDrizzle } from '@/lib/ai/db'
import type { Payload } from 'payload'

export async function getProductAffinityIds(
  payload: Payload,
  productId: number,
  limit: number,
): Promise<number[]> {
  const db = getPostgresDrizzle(payload)
  if (!db) return []

  try {
    const result = await db.execute(sql`
      SELECT "product_id_b" AS id
      FROM "product_affinity"
      WHERE "product_id_a" = ${productId}
      ORDER BY "score" DESC
      LIMIT ${limit}
    `)

    return (result.rows ?? [])
      .map((row) => Number(row.id))
      .filter((id) => Number.isFinite(id) && id !== productId)
  } catch {
    return []
  }
}

export async function rebuildProductAffinity(payload: Payload): Promise<{ pairs: number }> {
  const db = getPostgresDrizzle(payload)
  if (!db) return { pairs: 0 }

  const orders = await payload.find({
    collection: 'orders',
    depth: 0,
    limit: 5000,
    overrideAccess: true,
    pagination: false,
    where: {
      status: { in: ['processing', 'shipped', 'delivered', 'completed'] },
    },
  })

  const pairCounts = new Map<string, number>()

  for (const order of orders.docs) {
    const productIds = [
      ...new Set(
        (order.items ?? [])
          .map((item) => {
            const product = item.product
            if (typeof product === 'number') return product
            if (typeof product === 'object' && product && 'id' in product) return Number(product.id)
            return null
          })
          .filter((id): id is number => typeof id === 'number' && id > 0),
      ),
    ]

    for (let i = 0; i < productIds.length; i += 1) {
      for (let j = i + 1; j < productIds.length; j += 1) {
        const a = Math.min(productIds[i], productIds[j])
        const b = Math.max(productIds[i], productIds[j])
        const key = `${a}:${b}`
        pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1)
      }
    }
  }

  await db.execute(sql`DELETE FROM "product_affinity"`)

  let pairs = 0
  for (const [key, count] of pairCounts.entries()) {
    const [aRaw, bRaw] = key.split(':')
    const a = Number(aRaw)
    const b = Number(bRaw)
    if (!Number.isFinite(a) || !Number.isFinite(b)) continue

    const score = count
    await db.execute(sql`
      INSERT INTO "product_affinity" ("product_id_a", "product_id_b", "co_count", "score", "updated_at")
      VALUES (${a}, ${b}, ${count}, ${score}, now()),
             (${b}, ${a}, ${count}, ${score}, now())
      ON CONFLICT ("product_id_a", "product_id_b") DO UPDATE SET
        "co_count" = EXCLUDED."co_count",
        "score" = EXCLUDED."score",
        "updated_at" = now()
    `)
    pairs += 1
  }

  return { pairs }
}
