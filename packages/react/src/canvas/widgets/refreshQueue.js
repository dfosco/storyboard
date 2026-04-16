/**
 * Concurrent refresh queue for bulk snapshot recapture (e.g. on theme change).
 * Limits concurrent iframe-based captures to avoid overloading the main thread.
 * Supports cancellation by widget ID — if a user activates an embed while it's
 * queued, it gets removed so the manual interaction takes priority.
 */
const queue = []
let running = 0
const MAX_CONCURRENT = 2

/**
 * Enqueue a snapshot refresh task for a widget.
 * @param {string} widgetId — unique widget identifier (for cancellation)
 * @param {() => Promise<void>} fn — the async work to perform
 */
export function enqueueRefresh(widgetId, fn) {
  // Dedupe — if this widget is already queued, replace its task
  const existing = queue.findIndex(item => item.widgetId === widgetId)
  if (existing !== -1) queue.splice(existing, 1)

  queue.push({ widgetId, fn })
  drain()
}

/**
 * Cancel a pending refresh for a widget (e.g. user activated it manually).
 * Has no effect if the widget's task is already running.
 */
export function cancelRefresh(widgetId) {
  const idx = queue.findIndex(item => item.widgetId === widgetId)
  if (idx !== -1) queue.splice(idx, 1)
}

function drain() {
  while (running < MAX_CONCURRENT && queue.length > 0) {
    running++
    const { fn } = queue.shift()
    Promise.resolve()
      .then(fn)
      .catch(() => {})
      .finally(() => { running--; drain() })
  }
}
