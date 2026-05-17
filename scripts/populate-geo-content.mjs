#!/usr/bin/env node
/**
 * Populate AI & GEO fields for canonical products, categories, brands, and posts.
 *
 *   pnpm populate:geo
 *   pnpm populate:geo -- --force
 *   pnpm populate:geo -- --dry-run
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config.ts'
import { populateGeoContent } from '../src/endpoints/seed/populateGeoContent.ts'

const args = process.argv.slice(2)
const force = args.includes('--force')
const all = args.includes('--all')
const dryRun = args.includes('--dry-run')

const payload = await getPayload({ config })

if (dryRun) {
  const { pickCanonicalBySlug } = await import('../src/lib/seo/geoContent/pickCanonical.ts')
  const { generateProductGeo } = await import('../src/lib/seo/geoContent/generateProductGeo.ts')

  const products = await payload.find({
    collection: 'products',
    depth: 1,
    limit: 200,
    pagination: false,
    overrideAccess: true,
    where: { _status: { equals: 'published' } },
  })

  const canonical = pickCanonicalBySlug(products.docs).slice(0, 3)
  console.log('Dry run — sample product GEO for:', canonical.map((p) => p.slug))
  for (const p of canonical) {
    console.log('\n---', p.slug, '---')
    console.log(generateProductGeo(p))
  }
  process.exit(0)
}

console.log(`Populating GEO content (force=${force}, all=${all})...`)

const result = await populateGeoContent({
  payload,
  options: { force, includeDuplicates: all },
})

console.log(JSON.stringify(result, null, 2))
console.log('Done.')
process.exit(0)
