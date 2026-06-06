import { buildEditorState } from '@payloadcms/richtext-lexical'

import { callDeepSeekChat } from '@/lib/ai/deepseek'
import { isAiShoppingAssistantEnabled } from '@/lib/ai/config'
import { parseAiJsonObject } from '@/lib/ai/parseAiJson'
import {
  isProductGeneratableFieldKey,
  PRODUCT_GENERATABLE_FIELDS,
  type ProductGeneratableFieldKey,
} from '@/lib/ai/productFieldGeneration'

export type ProductGenerationContext = {
  brand?: string
  categories?: string[]
  currentValue?: unknown
  descriptionText?: string
  priceInBDT?: number | null
  technicalSpecs?: { label: string; value: string }[]
  title: string
}

function parseTextField(raw: string): string | null {
  const parsed = parseAiJsonObject(raw)
  if (!parsed) return null
  return typeof parsed.text === 'string' && parsed.text.trim() ? parsed.text.trim() : null
}

function parseKeyFeatures(raw: string): { feature: string }[] | null {
  const parsed = parseAiJsonObject(raw)
  if (!parsed || !Array.isArray(parsed.items)) return null

  const items = parsed.items
    .filter(
      (item): item is { feature: string } =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as { feature?: unknown }).feature === 'string',
    )
    .map((item) => ({ feature: item.feature.trim() }))
    .filter((item) => item.feature)
    .slice(0, 8)

  return items.length ? items : null
}

function parseFaqs(raw: string): { answer: string; question: string }[] | null {
  const parsed = parseAiJsonObject(raw)
  if (!parsed || !Array.isArray(parsed.items)) return null

  const items = parsed.items
    .filter(
      (item): item is { answer: string; question: string } =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as { question?: unknown }).question === 'string' &&
        typeof (item as { answer?: unknown }).answer === 'string',
    )
    .map((item) => ({
      answer: item.answer.trim(),
      question: item.question.trim(),
    }))
    .filter((item) => item.question && item.answer)
    .slice(0, 6)

  return items.length ? items : null
}

function parseTechnicalSpecs(raw: string): { label: string; value: string }[] | null {
  const parsed = parseAiJsonObject(raw)
  if (!parsed || !Array.isArray(parsed.items)) return null

  const items = parsed.items
    .filter(
      (item): item is { label: string; value: string } =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as { label?: unknown }).label === 'string' &&
        typeof (item as { value?: unknown }).value === 'string',
    )
    .map((item) => ({
      label: item.label.trim(),
      value: item.value.trim(),
    }))
    .filter((item) => item.label && item.value)
    .slice(0, 12)

  return items.length ? items : null
}

function plainTextToLexical(text: string) {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((part) => part.replace(/\s+/g, ' ').trim())
    .filter(Boolean)

  if (!paragraphs.length) {
    return buildEditorState({ text: text.trim() })
  }

  return {
    root: {
      type: 'root',
      children: paragraphs.map((paragraph) => ({
        type: 'paragraph',
        children: [
          {
            type: 'text',
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: paragraph,
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        textFormat: 0,
        textStyle: '',
        version: 1,
      })),
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  }
}

function buildUserPrompt(args: {
  config: (typeof PRODUCT_GENERATABLE_FIELDS)[ProductGeneratableFieldKey]
  context: ProductGenerationContext
  fieldKey: ProductGeneratableFieldKey
}) {
  const specs =
    args.context.technicalSpecs
      ?.map((row) => `${row.label}: ${row.value}`)
      .filter(Boolean)
      .join('; ') ?? ''

  const currentValue =
    typeof args.context.currentValue === 'string' ?
      args.context.currentValue.trim()
    : args.context.currentValue ?
      JSON.stringify(args.context.currentValue)
    : ''

  return [
    `Product title: ${args.context.title}`,
    args.context.brand ? `Brand: ${args.context.brand}` : '',
    args.context.categories?.length ? `Categories: ${args.context.categories.join(', ')}` : '',
    typeof args.context.priceInBDT === 'number' ?
      `Price: ${args.context.priceInBDT} BDT`
    : '',
    args.context.descriptionText ? `Existing description: ${args.context.descriptionText}` : '',
    specs ? `Existing specs: ${specs}` : '',
    currentValue ? `Current ${args.config.label} (refine or replace): ${currentValue}` : '',
    '',
    `Generate content for: ${args.config.label}`,
  ]
    .filter(Boolean)
    .join('\n')
}

export async function generateProductFieldContent(args: {
  context: ProductGenerationContext
  fieldKey: string
}): Promise<unknown | null> {
  if (!isAiShoppingAssistantEnabled()) return null
  if (!isProductGeneratableFieldKey(args.fieldKey)) return null

  const config = PRODUCT_GENERATABLE_FIELDS[args.fieldKey]
  if (!args.context.title?.trim()) return null

  const completion = await callDeepSeekChat({
    messages: [
      {
        role: 'system',
        content: `You generate ecommerce product content for a store in Bangladesh (BDT). Respond with ONLY valid JSON matching this schema:
${config.jsonSchema}

Task: ${config.instruction}`,
      },
      {
        role: 'user',
        content: buildUserPrompt({
          config,
          context: args.context,
          fieldKey: args.fieldKey,
        }),
      },
    ],
    tools: false,
  })

  const raw = completion.choices?.[0]?.message?.content?.trim()
  if (!raw) return null

  switch (config.outputType) {
    case 'string': {
      const text = parseTextField(raw)
      return text ?? null
    }
    case 'lexical': {
      const text = parseTextField(raw)
      return text ? plainTextToLexical(text) : null
    }
    case 'array': {
      if (args.fieldKey === 'seoContent.keyFeatures') return parseKeyFeatures(raw)
      if (args.fieldKey === 'seoContent.faqs') return parseFaqs(raw)
      if (args.fieldKey === 'technicalSpecs') return parseTechnicalSpecs(raw)
      return null
    }
    default:
      return null
  }
}
