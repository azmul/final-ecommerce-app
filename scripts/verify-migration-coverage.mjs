#!/usr/bin/env node
/**
 * Ensures every Postgres table name in the Payload-generated Drizzle schema has a matching
 * `CREATE TABLE` in `src/migrations/*.ts`. Run after adding collections/blocks/plugins:
 *
 *   pnpm generate:db-schema && pnpm verify:migration-coverage
 */
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const schemaPath = path.join(root, 'src', 'payload-generated-schema.ts')
const migrationsDir = path.join(root, 'src', 'migrations')

execSync('pnpm exec payload generate:db-schema', { cwd: root, stdio: 'inherit' })

if (!fs.existsSync(schemaPath)) {
  console.error('Expected generated schema at', schemaPath)
  process.exit(1)
}

const schema = fs.readFileSync(schemaPath, 'utf8')
const re = /export const \w+ = pgTable\(\s*'([^']+)'/g
const tables = new Set()
let m
while ((m = re.exec(schema))) tables.add(m[1])

const migSet = new Set()
for (const f of fs.readdirSync(migrationsDir)) {
  if (!f.endsWith('.ts') || f === 'index.ts') continue
  const t = fs.readFileSync(path.join(migrationsDir, f), 'utf8')
  const r = /CREATE TABLE( IF NOT EXISTS)? "([^"]+)"/g
  let mm
  while ((mm = r.exec(t))) migSet.add(mm[2])
}

const missing = [...tables].filter((x) => !migSet.has(x)).sort()
if (missing.length) {
  console.error(
    '\nTables present in Payload DB schema but missing from migration CREATE TABLE statements:\n',
  )
  console.error(missing.join('\n'))
  console.error(
    '\nFix: run `pnpm payload migrate:create` (against a DB that matches prod) or add SQL migrations, then re-run this check.\n',
  )
  process.exit(1)
}

console.log(`OK: all ${tables.size} payload schema tables are covered by migrations.`)

try {
  fs.unlinkSync(schemaPath)
} catch {
  /* ignore */
}
