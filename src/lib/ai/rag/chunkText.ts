import type { KnowledgeChunkInput } from '@/lib/ai/rag/types'

const DEFAULT_MAX_CHARS = 900
const DEFAULT_OVERLAP = 120

export function buildFaqChunk(args: {
  answer: string
  chunkIndex: number
  prefix?: string
  question: string
  sourceSlug?: string
  title: string
}): KnowledgeChunkInput {
  const question = args.question.trim()
  const answer = args.answer.trim()
  const prefix = args.prefix?.trim()

  const body = [`Q: ${question}`, `A: ${answer}`].filter(Boolean).join('\n')
  const chunkText = [`[${args.title}]`, prefix, body].filter(Boolean).join('\n')

  return {
    chunkIndex: args.chunkIndex,
    chunkText,
    sourceSlug: args.sourceSlug,
    title: args.title,
  }
}

export function chunkPlainText(args: {
  maxChars?: number
  overlap?: number
  sourceSlug?: string
  startIndex?: number
  text: string
  title: string
}): KnowledgeChunkInput[] {
  const maxChars = args.maxChars ?? DEFAULT_MAX_CHARS
  const overlap = args.overlap ?? DEFAULT_OVERLAP
  const normalized = args.text.replace(/\r\n/g, '\n').trim()
  if (!normalized) return []

  const paragraphs = normalized
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)

  const chunks: string[] = []
  let buffer = ''

  for (const paragraph of paragraphs) {
    const candidate = buffer ? `${buffer}\n\n${paragraph}` : paragraph
    if (candidate.length <= maxChars) {
      buffer = candidate
      continue
    }

    if (buffer) chunks.push(buffer)

    if (paragraph.length <= maxChars) {
      buffer = paragraph
      continue
    }

    let start = 0
    while (start < paragraph.length) {
      const end = Math.min(start + maxChars, paragraph.length)
      chunks.push(paragraph.slice(start, end).trim())
      if (end >= paragraph.length) break
      start = Math.max(end - overlap, start + 1)
    }
    buffer = ''
  }

  if (buffer) chunks.push(buffer)

  const startIndex = args.startIndex ?? 0

  return chunks.map((chunkText, index) => ({
    chunkIndex: startIndex + index,
    chunkText: `[${args.title}]\n${chunkText}`,
    sourceSlug: args.sourceSlug,
    title: args.title,
  }))
}
