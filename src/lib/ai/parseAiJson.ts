/** Strip markdown fences and parse the first JSON object from a model response. */
export function parseAiJsonObject(raw: string): Record<string, unknown> | null {
  const trimmed = raw.trim()
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = (fenced?.[1] ?? trimmed).trim()
  const match = candidate.match(/\{[\s\S]*\}/)
  if (!match) return null

  try {
    const parsed = JSON.parse(match[0]) as unknown
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ?
        (parsed as Record<string, unknown>)
      : null
  } catch {
    return null
  }
}
