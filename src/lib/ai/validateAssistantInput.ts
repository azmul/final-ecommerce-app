/**
 * Validation for client-supplied AI assistant input.
 *
 * The chat `history` is attacker-controlled, so without these caps a client
 * can (a) inject `role: 'system'` turns to override the assistant's
 * instructions (jailbreak / prompt injection) and (b) send unbounded text to
 * amplify paid-LLM cost. We whitelist roles to user/assistant only, cap the
 * number of turns, and cap per-message + total content length.
 */

export const MAX_MESSAGE_CHARS = 4000
export const MAX_HISTORY_TURNS = 20
export const MAX_HISTORY_CHARS = 4000

export type SafeHistoryEntry = { role: 'user' | 'assistant'; content: string }

export function clampText(value: unknown, maxChars: number): string {
  if (typeof value !== 'string') return ''
  return value.slice(0, maxChars)
}

export function sanitizeAssistantHistory(history: unknown): SafeHistoryEntry[] {
  if (!Array.isArray(history)) return []

  return history
    .filter((entry): entry is { role: unknown; content: unknown } =>
      Boolean(entry) && typeof entry === 'object',
    )
    // Drop any 'system' (or unknown) role — only the server sets the system prompt.
    .filter((entry) => entry.role === 'user' || entry.role === 'assistant')
    .map((entry) => ({
      role: entry.role as 'user' | 'assistant',
      content: clampText(entry.content, MAX_HISTORY_CHARS),
    }))
    .filter((entry) => entry.content.length > 0)
    .slice(-MAX_HISTORY_TURNS)
}
