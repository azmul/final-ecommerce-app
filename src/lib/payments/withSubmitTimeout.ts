const DEFAULT_CHECKOUT_SUBMIT_TIMEOUT_MS = 90_000

export const CHECKOUT_SUBMIT_TIMEOUT_MESSAGE =
  'Order submission timed out. Please try again in a moment.'

export function withCheckoutSubmitTimeout<T>(
  promise: Promise<T>,
  timeoutMs = DEFAULT_CHECKOUT_SUBMIT_TIMEOUT_MS,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(CHECKOUT_SUBMIT_TIMEOUT_MESSAGE))
    }, timeoutMs)

    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        clearTimeout(timer)
        reject(error)
      },
    )
  })
}
