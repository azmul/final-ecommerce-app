import { getLlmConfig } from '@/lib/ai/config'
import { AI_SHOPPING_TOOLS } from '@/lib/ai/tools'

export type LlmMessage =
  | { role: 'system' | 'user' | 'assistant'; content: string }
  | {
      role: 'assistant'
      content: string | null
      tool_calls?: {
        id: string
        type: 'function'
        function: { name: string; arguments: string }
      }[]
    }
  | { role: 'tool'; tool_call_id: string; content: string }

type ChatCompletionResponse = {
  choices?: {
    message?: {
      content?: string | null
      tool_calls?: {
        id: string
        type: 'function'
        function: { name: string; arguments: string }
      }[]
    }
  }[]
}

function buildLlmHeaders(config: ReturnType<typeof getLlmConfig>): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.apiKey}`,
    'Content-Type': 'application/json',
  }

  if (config.provider === 'openrouter') {
    const referer =
      process.env.OPENROUTER_HTTP_REFERER?.trim() ||
      process.env.NEXT_PUBLIC_SERVER_URL?.trim() ||
      process.env.PAYLOAD_PUBLIC_SERVER_URL?.trim()
    const appName = process.env.OPENROUTER_APP_NAME?.trim() || process.env.SITE_NAME?.trim()

    if (referer) headers['HTTP-Referer'] = referer
    if (appName) headers['X-Title'] = appName
  }

  return headers
}

export async function callLlmChat(args: {
  messages: LlmMessage[]
  tools?: boolean
}): Promise<ChatCompletionResponse> {
  const config = getLlmConfig()
  if (!config.provider || !config.apiKey) {
    throw new Error('No LLM provider configured. Set DEEPSEEK_API_KEY or OPENROUTER_API_KEY.')
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30_000)

  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      body: JSON.stringify({
        messages: args.messages,
        model: config.model,
        stream: false,
        temperature: 0.2,
        ...(args.tools ? { tool_choice: 'auto', tools: AI_SHOPPING_TOOLS } : {}),
      }),
      headers: buildLlmHeaders(config),
      method: 'POST',
      signal: controller.signal,
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      const label = config.provider === 'deepseek' ? 'DeepSeek' : 'OpenRouter'
      throw new Error(`${label} request failed (${response.status}): ${text}`)
    }

    return (await response.json()) as ChatCompletionResponse
  } finally {
    clearTimeout(timeout)
  }
}
