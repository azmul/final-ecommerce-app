/**
 * Schedules a state update outside the synchronous effect phase (React Compiler).
 */
export function queueStateUpdate(update: () => void): void {
  queueMicrotask(update)
}
