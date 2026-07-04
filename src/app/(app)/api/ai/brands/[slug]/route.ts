import { aiJsonResponse, getAiBrandContent } from '@/lib/seo/aiContent'
import { notFound } from 'next/navigation'

export const dynamic = 'force-static'
export const revalidate = 300

type Args = { params: Promise<{ slug: string }> }

export async function GET(_request: Request, { params }: Args) {
  const { slug } = await params
  const data = await getAiBrandContent(slug)
  if (!data) notFound()
  return aiJsonResponse(data)
}
