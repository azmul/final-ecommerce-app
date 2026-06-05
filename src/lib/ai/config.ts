export function isAiShoppingAssistantEnabled(): boolean {
  return Boolean(process.env.DEEPSEEK_API_KEY?.trim())
}

export function getDeepSeekConfig() {
  return {
    apiKey: process.env.DEEPSEEK_API_KEY?.trim() ?? '',
    baseUrl: (process.env.DEEPSEEK_BASE_URL?.trim() || 'https://api.deepseek.com').replace(/\/$/, ''),
    model: process.env.DEEPSEEK_MODEL?.trim() || 'deepseek-chat',
  }
}

export function getEmbeddingConfig() {
  const apiKey =
    process.env.EMBEDDING_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim() || ''
  const baseUrl = (
    process.env.EMBEDDING_BASE_URL?.trim() || 'https://api.openai.com/v1'
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
