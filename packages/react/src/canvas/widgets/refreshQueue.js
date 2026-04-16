/**
 * Concurrent refresh queue for bulk snapshot recapture (e.g. on theme change).
 * Limits concurrent iframe-based captures to avoid overloading the main thread.
 * Staggers starts by 150ms for a smooth visual cascade.
 * Supports cancellation by widget ID — if a user activates an embed while it's
 * queued, it gets removed so the manual interaction takes priority.
 */
const queue = []
let running = 0
let drainScheduled = false

// 4 concurrent is safe: iframe loading is async (network/parse), and the
// blocking part (toBlob) naturally serializes because each widget's iframe
// loads at different speeds. Memory is fine — these are same-origin lightweight
// pages, not heavy external sites.
const MAX_CONCURRENT = 4
const STAGGER_MS = 150

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
  scheduleDrain()
}

/**
 * Cancel a pending refresh for a widget (e.g. user activated it manually).
 * Has no effect if the widget's task is already running.
 */
export function cancelRefresh(widgetId) {
  const idx = queue.findIndex(item => item.widgetId === widgetId)
  if (idx !== -1) queue.splice(idx, 1)
}

function scheduleDrain() {
  if (drainScheduled) return
  drainScheduled = true
  // Use setTimeout(0) to batch multiple enqueueRefresh calls from the same
  // React commit into a single drain pass.
  setTimeout(() => { drainScheduled = false; drain() }, 0)
}

function drain() {
  if (running >= MAX_CONCURRENT || queue.length === 0) return

  running++
  const { fn } = queue.shift()
  Promise.resolve()
    .then(fn)
    .catch(() => {})
    .finally(() => { running--; drain() })

  // Stagger the next start for a visual cascade
  if (queue.length > 0 && running < MAX_CONCURRENT) {
    setTimeout(drain, STAGGER_MS)
  }
}
