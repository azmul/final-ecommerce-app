import type { Payload } from 'payload'

export function deferTask(
  payload: Payload,
  label: string,
  task: () => Promise<void>,
): void {
  setImmediate(() => {
    void task().catch((err) => {
      payload.logger.error({ err, msg: `Deferred task failed: ${label}` })
    })
  })
}
