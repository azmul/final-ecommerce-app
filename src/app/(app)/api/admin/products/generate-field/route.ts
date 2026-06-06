import { generateProductFieldContent } from '@/lib/ai/generateProductFieldContent'
import { isProductGeneratableFieldKey } from '@/lib/ai/productFieldGeneration'
import { isAiShoppingAssistantEnabled } from '@/lib/ai/config'
import { requireStaffPermissionApi } from '@/lib/permissions/requireStaffPermissionApi'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

type GenerateFieldBody = {
  context?: {
    brand?: string
    categories?: string[]
    currentValue?: unknown
    descriptionText?: string
    priceInBDT?: number | null
    technicalSpecs?: { label: string; value: string }[]
    title?: string
  }
  fieldKey?: string
}

export async function POST(request: Request) {
  let auth = await requireStaffPermissionApi('products', 'edit', request.headers)
  if (!auth.ok) {
    auth = await requireStaffPermissionApi('products', 'create', request.headers)
  }
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status })
  }

  if (!isAiShoppingAssistantEnabled()) {
    return NextResponse.json(
      { error: 'DeepSeek AI is not configured. Set DEEPSEEK_API_KEY in your environment.' },
      { status: 503 },
    )
  }

  let body: GenerateFieldBody
  try {
    body = (await request.json()) as GenerateFieldBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const fieldKey = body.fieldKey?.trim()
  if (!fieldKey || !isProductGeneratableFieldKey(fieldKey)) {
    return NextResponse.json({ error: 'Unsupported field key.' }, { status: 400 })
  }

  const title = body.context?.title?.trim()
  if (!title) {
    return NextResponse.json({ error: 'Product title is required before generating content.' }, { status: 400 })
  }

  try {
    const value = await generateProductFieldContent({
      context: {
        brand: body.context?.brand,
        categories: body.context?.categories,
        currentValue: body.context?.currentValue,
        descriptionText: body.context?.descriptionText,
        priceInBDT: body.context?.priceInBDT,
        technicalSpecs: body.context?.technicalSpecs,
        title,
      },
      fieldKey,
    })

    if (value == null) {
      return NextResponse.json({ error: 'AI did not return usable content. Try again.' }, { status: 502 })
    }

    return NextResponse.json({ fieldKey, value })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Generation failed.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
