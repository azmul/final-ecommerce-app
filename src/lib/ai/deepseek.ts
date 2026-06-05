import { getDeepSeekConfig } from '@/lib/ai/config'
import { AI_SHOPPING_TOOLS } from '@/lib/ai/tools'

export type DeepSeekMessage =
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

export async function callDeepSeekChat(args: {
  messages: DeepSeekMessage[]
  tools?: boolean
}): Promise<ChatCompletionResponse> {
  const config = getDeepSeekConfig()
  if (!config.apiKey) {
    throw new Error('DEEPSEEK_API_KEY is not configured.')
  }

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    body: JSON.stringify({
      messages: args.messages,
      model: config.model,
      stream: false,
      temperature: 0.2,
      ...(args.tools ? { tool_choice: 'auto', tools: AI_SHOPPING_TOOLS } : {}),
    }),
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`DeepSeek request failed (${response.status}): ${text}`)
  }

  return (await response.json()) as ChatCompletionResponse
}
