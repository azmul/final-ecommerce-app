'use client'

import { Button, useField, useForm, useFormFields } from '@payloadcms/ui'
import React, { useCallback, useMemo, useState } from 'react'

import { applyProductArrayFieldValue } from '@/lib/admin/applyProductArrayFieldValue'
import {
  isProductGeneratableFieldKey,
  PRODUCT_GENERATABLE_FIELDS,
  type ProductGeneratableFieldKey,
} from '@/lib/ai/productFieldGeneration'
import { extractLexicalPlainText } from '@/utilities/extractLexicalPlainText'

import './index.scss'

const baseClass = 'product-ai-generate-button'

const ARRAY_FIELD_KEYS = new Set<ProductGeneratableFieldKey>([
  'seoContent.faqs',
  'seoContent.keyFeatures',
  'technicalSpecs',
])

type RelationshipValue = { title?: string | null } | number | string | null | undefined

function relationshipTitle(value: RelationshipValue): string | undefined {
  if (value && typeof value === 'object' && 'title' in value && typeof value.title === 'string') {
    return value.title
  }
  return undefined
}

function relationshipTitles(values: unknown): string[] {
  if (!Array.isArray(values)) return []
  return values
    .map((item) => relationshipTitle(item as RelationshipValue))
    .filter((title): title is string => Boolean(title))
}

type ProductAiGenerateButtonProps = {
  path: string
}

export function ProductAiGenerateButton({
  path,
  schemaPath,
}: ProductAiGenerateButtonProps & { schemaPath?: string }) {
  const fieldKey = path
  const isSupported = isProductGeneratableFieldKey(fieldKey)
  const fieldLabel = isSupported ? PRODUCT_GENERATABLE_FIELDS[fieldKey].label : path

  const { setValue, value } = useField({ path, potentiallyStalePath: path })
  const resolvedSchemaPath = schemaPath ?? path
  const form = useForm()
  const formFields = useFormFields(([fields]) => fields)

  const title = (formFields.title?.value as string | undefined)?.trim() ?? ''
  const descriptionText = useMemo(
    () => extractLexicalPlainText(formFields.description?.value, 1200) ?? undefined,
    [formFields.description?.value],
  )
  const brand = relationshipTitle(formFields.brand?.value as RelationshipValue)
  const categories = relationshipTitles(formFields.categories?.value)
  const priceInBDT =
    typeof formFields.priceInBDT?.value === 'number' ? formFields.priceInBDT.value : null
  const technicalSpecs = Array.isArray(formFields.technicalSpecs?.value) ?
      (formFields.technicalSpecs.value as { label?: string; value?: string }[])
        .filter(
          (row): row is { label: string; value: string } =>
            typeof row?.label === 'string' &&
            typeof row?.value === 'string' &&
            Boolean(row.label.trim()) &&
            Boolean(row.value.trim()),
        )
        .map((row) => ({ label: row.label.trim(), value: row.value.trim() }))
    : undefined

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const applyGeneratedValue = useCallback(
    (generated: unknown) => {
      if (!isSupported) return

      if (ARRAY_FIELD_KEYS.has(fieldKey) && Array.isArray(generated)) {
        applyProductArrayFieldValue({
          fieldKey,
          form,
          items: generated as Record<string, string>[],
          path,
          schemaPath: resolvedSchemaPath,
        })
        return
      }

      setValue(generated)
    },
    [fieldKey, form, isSupported, path, resolvedSchemaPath, setValue],
  )

  const generate = useCallback(async () => {
    if (!isSupported) return

    setError(null)

    if (!title) {
      setError('Enter a product title first.')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/admin/products/generate-field', {
        body: JSON.stringify({
          context: {
            brand,
            categories,
            currentValue: value,
            descriptionText,
            priceInBDT,
            technicalSpecs,
            title,
          },
          fieldKey,
        }),
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })

      const data = (await response.json()) as { error?: string; value?: unknown }

      if (!response.ok) {
        setError(data.error ?? 'Generation failed.')
        return
      }

      if (data.value === undefined) {
        setError('AI did not return content.')
        return
      }

      applyGeneratedValue(data.value)
    } catch {
      setError('Could not reach the AI service.')
    } finally {
      setLoading(false)
    }
  }, [
    applyGeneratedValue,
    brand,
    categories,
    descriptionText,
    fieldKey,
    isSupported,
    priceInBDT,
    technicalSpecs,
    title,
    value,
  ])

  if (!isSupported) return null

  return (
    <div className={baseClass}>
      <Button buttonStyle="secondary" disabled={loading} onClick={generate} size="small" type="button">
        {loading ? 'Generating…' : 'Generate with AI'}
      </Button>
      {!title && !error ? (
        <p className={`${baseClass}__hint`}>Enter a product title above to generate {fieldLabel}.</p>
      ) : null}
      {error ? <p className={`${baseClass}__error`}>{error}</p> : null}
    </div>
  )
}
