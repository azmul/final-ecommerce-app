import { toast } from 'sonner'

function toMessage(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  }
  return null
}

export function appToastError(message: unknown, fallback?: string): void {
  const text = toMessage(message) ?? fallback
  if (text) toast.error(text)
}

export function appToastSuccess(message: unknown, fallback?: string): void {
  const text = toMessage(message) ?? fallback
  if (text) toast.success(text)
}

export function appToastWarning(message: unknown): void {
  const text = toMessage(message)
  if (text) toast.warning(text)
}

export function appToastInfo(message: unknown): void {
  const text = toMessage(message)
  if (text) toast.info(text)
}

/** URL query alerts (`?error=`, `?success=`, etc.) */
export function appToastFromSearchParam(param: string, rawValue: string): void {
  const value = decodeURIComponent(rawValue)

  switch (param) {
    case 'error':
      appToastError(value)
      break
    case 'success':
      appToastSuccess(value)
      break
    case 'warning':
      appToastWarning(value)
      break
    default:
      toast.message(value)
  }
}
