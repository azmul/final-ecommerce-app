export function normalizeGiftCardCode(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, '')
}
