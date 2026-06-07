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

type NormalizedToolCall = {
  id: string
  type: 'function'
  function: { name: string; arguments: string }
}

function normalizeToolCalls(toolCalls: unknown): NormalizedToolCall[] | undefined {
  if (!Array.isArray(toolCalls)) return undefined

  const normalized = toolCalls
    .map((call, index): NormalizedToolCall | null => {
      if (!call || typeof call !== 'object') return null

      const row = call as {
        id?: string
        type?: string
        function?: { name?: string; arguments?: string }
      }

      const name = row.function?.name?.trim()
      if (!name) return null

      return {
        function: {
          arguments: row.function?.arguments ?? '{}',
          name,
        },
        id: row.id?.trim() || `call_${index}`,
        type: 'function',
      }
    })
    .filter((call): call is NormalizedToolCall => call !== null)

  return normalized.length ? normalized : undefined
}

function normalizeChatCompletionResponse(json: unknown): ChatCompletionResponse {
  const response = json as ChatCompletionResponse
  const message = response.choices?.[0]?.message
  if (!message) return response

  const toolCalls = normalizeToolCalls(message.tool_calls)
  if (!toolCalls) return response

  return {
    ...response,
    choices: [
      {
        ...response.choices![0],
        message: {
          ...message,
          tool_calls: toolCalls,
        },
      },
    ],
  }
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
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs)

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

    return normalizeChatCompletionResponse(await response.json())
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      const label = config.provider === 'deepseek' ? 'DeepSeek' : 'OpenRouter'
      throw new Error(
        `${label} request timed out after ${Math.round(config.timeoutMs / 1000)}s (model: ${config.model}).`,
      )
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}
