/** Formats a date/time in the viewer's local timezone (call from client components). */
export function formatLocalDateTime(date: Date): string {
  if (typeof Intl === 'undefined') {
    return ''
  }

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone,
    timeZoneName: 'short',
  }).format(date)
}
