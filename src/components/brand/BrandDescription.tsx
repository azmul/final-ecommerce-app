/** Server-rendered brand copy — full text always in HTML for crawlers and AI. */
export function BrandDescription({ text }: { text: string }) {
  const full = text.trim()
  if (!full) return null

  return (
    <p className="whitespace-pre-line font-serif text-[15px] leading-relaxed text-muted-foreground sm:text-base md:text-[17px]">
      {full}
    </p>
  )
}
