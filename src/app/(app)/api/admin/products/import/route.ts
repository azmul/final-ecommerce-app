import { logAdminAudit } from '@/lib/admin/logAdminAudit'
import { requireStaffPermissionApi } from '@/lib/permissions/requireStaffPermissionApi'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function parseCsvLine(line: string): string[] {
  const out: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
      continue
    }
    if (ch === ',' && !inQuotes) {
      out.push(current.trim())
      current = ''
      continue
    }
    current += ch
  }

  out.push(current.trim())
  return out
}

export async function POST(request: Request) {
  const payload = await getPayload({ config: configPromise })

  // Honors full-admin and emits the access_denied audit trail.
  const auth = await requireStaffPermissionApi('products', 'create', request.headers)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status })
  }

  const csv = await request.text()
  const lines = csv.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)

  if (lines.length < 2) {
    return NextResponse.json({ error: 'CSV must include a header row and at least one product.' }, { status: 400 })
  }

  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase())
  const titleIdx = headers.indexOf('title')
  const slugIdx = headers.indexOf('slug')
  const priceIdx = headers.indexOf('priceinbdt')
  const inventoryIdx = headers.indexOf('inventory')

  if (titleIdx === -1 || slugIdx === -1 || priceIdx === -1) {
    return NextResponse.json(
      { error: 'CSV headers must include title, slug, and priceInBDT.' },
      { status: 400 },
    )
  }

  const created: number[] = []
  const errors: string[] = []

  for (let i = 1; i < lines.length; i += 1) {
    const cols = parseCsvLine(lines[i])
    const title = cols[titleIdx]?.trim()
    const slug = cols[slugIdx]?.trim()
    const price = Number(cols[priceIdx])
    const inventory = inventoryIdx >= 0 ? Number(cols[inventoryIdx]) : 0

    if (!title || !slug || !Number.isFinite(price)) {
      errors.push(`Row ${i + 1}: invalid title, slug, or price.`)
      continue
    }

    try {
      const doc = await payload.create({
        collection: 'products',
        data: {
          _status: 'draft',
          inventory: Number.isFinite(inventory) ? inventory : 0,
          priceInBDT: price,
          slug,
          title,
        },
        overrideAccess: true,
      })
      created.push(doc.id as number)
    } catch (err) {
      errors.push(`Row ${i + 1}: ${err instanceof Error ? err.message : 'create failed'}`)
    }
  }

  await logAdminAudit({
    action: 'bulk_import_products',
    collection: 'products',
    metadata: { createdCount: created.length, errorCount: errors.length },
    payload,
    summary: `Imported ${created.length} products from CSV`,
  })

  return NextResponse.json({ created: created.length, createdIds: created, errors })
}
