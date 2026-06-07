export type LlmProvider = 'deepseek' | 'openrouter'

const DEFAULT_OPENROUTER_MODEL = 'nvidia/nemotron-3-super-120b-a12b:free'

function normalizeOpenAiCompatibleBaseUrl(url: string): string {
  return url.replace(/\/chat\/completions\/?$/, '').replace(/\/$/, '')
}

export function getActiveLlmProvider(): LlmProvider | null {
  if (process.env.DEEPSEEK_API_KEY?.trim()) return 'deepseek'
  if (process.env.OPENROUTER_API_KEY?.trim()) return 'openrouter'
  return null
}

export function isAiShoppingAssistantEnabled(): boolean {
  return getActiveLlmProvider() !== null
}

export function getAiNotConfiguredMessage(): string {
  return 'AI is not configured. Set DEEPSEEK_API_KEY or OPENROUTER_API_KEY in your environment.'
}

/** Nemotron and other free OpenRouter models often exceed 30s end-to-end latency. */
export function getLlmRequestTimeoutMs(): number {
  const explicit = Number(process.env.LLM_REQUEST_TIMEOUT_MS)
  if (Number.isFinite(explicit) && explicit > 0) return explicit

  const openRouterExplicit = Number(process.env.OPENROUTER_REQUEST_TIMEOUT_MS)
  if (Number.isFinite(openRouterExplicit) && openRouterExplicit > 0) return openRouterExplicit

  return getActiveLlmProvider() === 'openrouter' ? 120_000 : 30_000
}

export function getLlmConfig() {
  const provider = getActiveLlmProvider()

  if (provider === 'deepseek') {
    return {
      apiKey: process.env.DEEPSEEK_API_KEY!.trim(),
      baseUrl: normalizeOpenAiCompatibleBaseUrl(
        process.env.DEEPSEEK_BASE_URL?.trim() || 'https://api.deepseek.com',
      ),
      model: process.env.DEEPSEEK_MODEL?.trim() || 'deepseek-chat',
      provider: 'deepseek' as const,
      timeoutMs: getLlmRequestTimeoutMs(),
    }
  }

  if (provider === 'openrouter') {
    return {
      apiKey: process.env.OPENROUTER_API_KEY!.trim(),
      baseUrl: normalizeOpenAiCompatibleBaseUrl(
        process.env.OPENROUTER_BASE_URL?.trim() || 'https://openrouter.ai/api/v1',
      ),
      model: process.env.OPENROUTER_MODEL?.trim() || DEFAULT_OPENROUTER_MODEL,
      provider: 'openrouter' as const,
      timeoutMs: getLlmRequestTimeoutMs(),
    }
  }

  return {
    apiKey: '',
    baseUrl: '',
    model: '',
    provider: null as null,
    timeoutMs: 30_000,
  }
}

/** @deprecated Use getLlmConfig() */
export function getDeepSeekConfig() {
  const config = getLlmConfig()
  return {
    apiKey: config.apiKey,
    baseUrl: config.baseUrl,
    model: config.model,
  }
}

export function getEmbeddingConfig() {
  const apiKey =
    process.env.EMBEDDING_API_KEY?.trim() ||
    process.env.OPENAI_API_KEY?.trim() ||
    process.env.OPENROUTER_API_KEY?.trim() ||
    ''
  const baseUrl = (
    process.env.EMBEDDING_BASE_URL?.trim() ||
    (process.env.OPENROUTER_API_KEY?.trim() && !process.env.EMBEDDING_API_KEY?.trim()
      ? 'https://openrouter.ai/api/v1'
      : 'https://api.openai.com/v1')
  ).replace(/\/$/, '')
  const model = process.env.EMBEDDING_MODEL?.trim() || 'text-embedding-3-small'

  return {
    apiKey,
    baseUrl,
    dimensions: 1536,
    enabled: Boolean(apiKey),
    model,
  }
}

export const AI_PRODUCT_SEARCH_LIMIT = 20

export const AI_CHAT_PRODUCT_DISPLAY_LIMIT = 10

export function getRagConfig() {
  const minScore = Number(process.env.RAG_MIN_SIMILARITY_SCORE)
  const chunkMaxChars = Number(process.env.RAG_CHUNK_MAX_CHARS)
  const defaultLimit = Number(process.env.RAG_DEFAULT_LIMIT)

  return {
    chunkMaxChars: Number.isFinite(chunkMaxChars) && chunkMaxChars > 200 ? chunkMaxChars : 900,
    chunkOverlap: 120,
    defaultLimit: Number.isFinite(defaultLimit) && defaultLimit > 0 ? defaultLimit : 5,
    maxLimit: 8,
    minSimilarityScore: Number.isFinite(minScore) && minScore > 0 ? minScore : 0.3,
    vectorCandidateMultiplier: 4,
  }
}
