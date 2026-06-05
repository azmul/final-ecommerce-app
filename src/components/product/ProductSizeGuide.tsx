import type { Product } from '@/payload-types'
import { Ruler } from 'lucide-react'
import React from 'react'

type Props = { product: Product }

export function ProductSizeGuide({ product }: Props) {
  const rows = product.sizeGuide
  if (!rows?.length) return null

  const cols = ['chest', 'waist', 'hip', 'length'] as const

  return (
    <section className="rounded-2xl border border-border/70 bg-muted/10 p-6">
      <div className="mb-4 flex items-center gap-2">
        <Ruler aria-hidden className="size-5 text-primary" />
        <h2 className="text-lg font-semibold">Size guide</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[20rem] text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="px-3 py-2 font-medium">Size</th>
              {cols.map((col) => (
                <th key={col} className="px-3 py-2 font-medium capitalize">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id ?? index} className="border-b border-border/50">
                <td className="px-3 py-2 font-medium">{row.sizeLabel}</td>
                {cols.map((col) => (
                  <td key={col} className="px-3 py-2 text-muted-foreground">
                    {row[col] ? String(row[col]) : '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {product.sizeGuideNote ?
        <p className="mt-3 text-xs text-muted-foreground">{product.sizeGuideNote}</p>
      : null}
    </section>
  )
}
