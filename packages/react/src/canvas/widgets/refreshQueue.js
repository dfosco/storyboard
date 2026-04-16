/**
 * Concurrent refresh queue for bulk snapshot recapture (e.g. on theme change).
 *
 * Captures run in parallel (up to MAX_CONCURRENT) for speed, but REVEALS are
 * staggered on a fixed timeline — widget 0 reveals at 0ms, widget 1 at
 * REVEAL_INTERVAL ms, widget 2 at 2×REVEAL_INTERVAL ms, etc., all relative to
 * batch start. This creates a clean, predictable wave sweep regardless of how
 * fast each capture completes.
 *
 * After a batch completes, any widgets that failed are re-enqueued for a
 * single retry pass.
 *
 * Sorted spatially (top-to-bottom, left-to-right) before assigning reveal slots.
 * Supports cancellation by widget ID.
 */
const queue = []
let running = 0
let drainScheduled = false
let batchTotal = 0
let batchDone = 0
const batchFailed = []

const MAX_CONCURRENT = 4
export const REVEAL_INTERVAL = 200

/**
 * Enqueue a snapshot refresh task for a widget.
 * @param {string} widgetId — unique widget identifier (for cancellation)
 * @param {(meta: { revealOrder: number, batchStart: number }) => Promise<boolean>} fn
 *   Must resolve to `true` on success, `false` on failure.
 * @param {{ x: number, y: number }} [pos] — spatial position for wave ordering
 */
export function enqueueRefresh(widgetId, fn, pos) {
  const existing = queue.findIndex(item => item.widgetId === widgetId)
  if (existing !== -1) queue.splice(existing, 1)

  queue.push({ widgetId, fn, x: pos?.x ?? 0, y: pos?.y ?? 0 })
  scheduleDrain()
}

/**
 * Cancel a pending refresh for a widget (e.g. user activated it manually).
 */
export function cancelRefresh(widgetId) {
  const idx = queue.findIndex(item => item.widgetId === widgetId)
  if (idx !== -1) queue.splice(idx, 1)
}

function scheduleDrain() {
  if (drainScheduled) return
  drainScheduled = true
  // Batch all enqueueRefresh calls from the same React commit, then sort
  // spatially and assign reveal slots before starting captures.
  setTimeout(() => {
    drainScheduled = false
    queue.sort((a, b) => a.y - b.y || a.x - b.x)
    const batchStart = Date.now()
    batchTotal = queue.length
    batchDone = 0
    batchFailed.length = 0
    queue.forEach((item, i) => {
      item.revealOrder = i
      item.batchStart = batchStart
      item.isRetry = item.isRetry || false
    })
    drain()
  }, 0)
}

function onTaskDone(success, item) {
  batchDone++
  if (!success && !item.isRetry) {
    batchFailed.push(item)
  }
  // When batch is complete, re-enqueue failures for one retry
  if (batchDone >= batchTotal && batchFailed.length > 0) {
    const retries = batchFailed.splice(0)
    for (const failed of retries) {
      failed.isRetry = true
      queue.push(failed)
    }
    batchTotal = queue.length
    batchDone = 0
    const batchStart = Date.now()
    queue.forEach((item, i) => {
      item.revealOrder = i
      item.batchStart = batchStart
    })
  }
  drain()
}

function drain() {
  if (running >= MAX_CONCURRENT || queue.length === 0) return

  running++
  const item = queue.shift()
  const { fn, revealOrder, batchStart } = item
  Promise.resolve()
    .then(() => fn({ revealOrder, batchStart }))
    .then((success) => { running--; onTaskDone(success !== false, item) })
    .catch(() => { running--; onTaskDone(false, item) })

  // Start next capture immediately (no stagger on capture start — only reveals are staggered)
  if (queue.length > 0 && running < MAX_CONCURRENT) {
    drain()
  }
}
