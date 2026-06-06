import { callDeepSeekChat } from '@/lib/ai/deepseek'
import { isAiShoppingAssistantEnabled } from '@/lib/ai/config'

export async function generateAbandonedCartEmail(args: {
  customerName?: string | null
  itemTitles: string[]
  siteName: string
}): Promise<{ bodyHtml: string; subject: string } | null> {
  if (!isAiShoppingAssistantEnabled() || !args.itemTitles.length) return null

  const items = args.itemTitles.map((title) => `- ${title}`).join('\n')
  const name = args.customerName?.trim() || 'there'

  const completion = await callDeepSeekChat({
    messages: [
      {
        role: 'system',
        content: `Write a short abandoned cart recovery email for ${args.siteName} (Bangladesh ecommerce, BDT).
Respond with ONLY JSON: {"subject":"...", "bodyHtml":"..."}
bodyHtml should be simple HTML paragraphs and a bullet list — no outer html/body tags.`,
      },
      {
        role: 'user',
        content: `Customer name: ${name}\nCart items:\n${items}`,
      },
    ],
    tools: false,
  })

  const raw = completion.choices?.[0]?.message?.content?.trim()
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? raw) as {
      bodyHtml?: string
      subject?: string
    }
    if (!parsed.subject?.trim() || !parsed.bodyHtml?.trim()) return null
    return { bodyHtml: parsed.bodyHtml.trim(), subject: parsed.subject.trim() }
  } catch {
    return null
  }
}
