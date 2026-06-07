import { callLlmChat, type LlmMessage } from '@/lib/ai/llm'

export type DeepSeekMessage = LlmMessage

export async function callDeepSeekChat(args: {
  messages: DeepSeekMessage[]
  tools?: boolean
}) {
  return callLlmChat(args)
}
