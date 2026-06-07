export type LlmProvider = 'deepseek' | 'openrouter'

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

export function getLlmConfig() {
  const provider = getActiveLlmProvider()

  if (provider === 'deepseek') {
    return {
      apiKey: process.env.DEEPSEEK_API_KEY!.trim(),
      baseUrl: (process.env.DEEPSEEK_BASE_URL?.trim() || 'https://api.deepseek.com').replace(
        /\/$/,
        '',
      ),
      model: process.env.DEEPSEEK_MODEL?.trim() || 'deepseek-chat',
      provider: 'deepseek' as const,
    }
  }

  if (provider === 'openrouter') {
    return {
      apiKey: process.env.OPENROUTER_API_KEY!.trim(),
      baseUrl: (process.env.OPENROUTER_BASE_URL?.trim() || 'https://openrouter.ai/api/v1').replace(
        /\/$/,
        '',
      ),
      model: process.env.OPENROUTER_MODEL?.trim() || 'openai/gpt-oss-120b:free',
      provider: 'openrouter' as const,
    }
  }

  return {
    apiKey: '',
    baseUrl: '',
    model: '',
    provider: null as null,
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
