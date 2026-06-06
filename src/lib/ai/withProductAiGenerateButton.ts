import type { Field } from 'payload'

const PRODUCT_AI_GENERATE_BUTTON =
  '@/components/admin/ProductAiGenerateButton#ProductAiGenerateButton'

type FieldComponentsWithAfterInput = {
  afterInput?: string | string[]
}

/** Adds a DeepSeek "Generate with AI" button below supported product text fields. */
export function withProductAiGenerateButton<T extends Field>(field: T): T {
  const existingComponents = field.admin?.components as FieldComponentsWithAfterInput | undefined
  const existingAfterInput = existingComponents?.afterInput
  const afterInput =
    Array.isArray(existingAfterInput) ? existingAfterInput
    : existingAfterInput ? [existingAfterInput]
    : []

  return {
    ...field,
    admin: {
      ...field.admin,
      components: {
        ...field.admin?.components,
        afterInput: [...afterInput, PRODUCT_AI_GENERATE_BUTTON],
      },
    },
  } as T
}
