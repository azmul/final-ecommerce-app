const EXPANSION_GROUPS: string[][] = [
  ['shipping', 'delivery', 'courier', 'dispatch', 'ship', 'ডেলিভারি', 'শিপিং', 'পাঠানো'],
  ['return', 'refund', 'exchange', 'cancel', 'রিটার্ন', 'ফেরত', 'রিফান্ড', 'বাতিল'],
  ['payment', 'pay', 'cod', 'cash on delivery', 'পেমেন্ট', 'পেই', 'ক্যাশ'],
  ['order', 'track', 'tracking', 'status', 'অর্ডার', 'ট্র্যাক'],
  ['account', 'login', 'password', 'sign in', 'অ্যাকাউন্ট', 'লগইন'],
  ['warranty', 'guarantee', 'ওয়ারেন্টি'],
  ['contact', 'support', 'help', 'customer service', 'সাপোর্ট', 'যোগাযোগ'],
]

function normalizeForMatch(value: string): string {
  return value.toLowerCase().trim()
}

function groupMatchesQuery(group: string[], query: string): boolean {
  const normalized = normalizeForMatch(query)
  return group.some((term) => normalized.includes(normalizeForMatch(term)))
}

/** Lightweight query variants for hybrid RAG retrieval (no extra LLM call). */
export function expandRagQueries(query: string): string[] {
  const trimmed = query.trim()
  if (!trimmed) return []

  const variants = new Set<string>([trimmed])

  for (const group of EXPANSION_GROUPS) {
    if (!groupMatchesQuery(group, trimmed)) continue
    variants.add(`${trimmed} ${group.slice(0, 4).join(' ')}`.trim())
  }

  return [...variants].slice(0, 3)
}
