const HTML_ENTITY_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
}

const RE_UNSAFE = /[&<>"'/]/g

export function escapeHtml(str: string): string {
  if (typeof str !== 'string') return ''
  return str.replace(RE_UNSAFE, (c) => HTML_ENTITY_MAP[c] || c)
}
