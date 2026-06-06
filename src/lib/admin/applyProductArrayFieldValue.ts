import type { ProductGeneratableFieldKey } from '@/lib/ai/productFieldGeneration'
import type { FormState } from 'payload'

/** Subset of Payload admin form context used to populate array fields. */
export type ProductArrayForm = {
  addFieldRow: (args: {
    blockType?: string
    path: string
    rowIndex?: number
    schemaPath: string
    subFieldState?: FormState
  }) => void
  getDataByPath: (path: string) => unknown
  removeFieldRow: (args: { path: string; rowIndex: number }) => void
  setModified: (modified: boolean) => void
}

const ARRAY_FIELD_SHAPE: Partial<
  Record<ProductGeneratableFieldKey, Record<string, string>>
> = {
  'seoContent.faqs': { answer: '', question: '' },
  'seoContent.keyFeatures': { feature: '' },
  technicalSpecs: { label: '', value: '' },
}

export function applyProductArrayFieldValue(args: {
  fieldKey: ProductGeneratableFieldKey
  form: ProductArrayForm
  items: Record<string, string>[]
  path: string
  schemaPath: string
}) {
  const shape = ARRAY_FIELD_SHAPE[args.fieldKey]
  if (!shape) return

  const current = args.form.getDataByPath(args.path)
  const rowCount = Array.isArray(current) ? current.length : 0

  for (let rowIndex = rowCount - 1; rowIndex >= 0; rowIndex -= 1) {
    args.form.removeFieldRow({ path: args.path, rowIndex })
  }

  args.items.forEach((item, rowIndex) => {
    const subFieldState: FormState = {}

    for (const key of Object.keys(shape)) {
      const value = item[key]?.trim()
      if (!value) continue
      subFieldState[key] = {
        initialValue: value,
        valid: true,
        value,
      }
    }

    if (Object.keys(subFieldState).length === 0) return

    args.form.addFieldRow({
      path: args.path,
      rowIndex,
      schemaPath: args.schemaPath,
      subFieldState,
    })
  })

  args.form.setModified(true)
}
