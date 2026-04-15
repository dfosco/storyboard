import { useState, useEffect, useCallback, useRef } from 'react'
import { getFlag } from '@dfosco/storyboard-core'

function devLog(...args) {
  try { if (getFlag('dev-logs')) console.log('[canvas:iframe-queue]', ...args) } catch { /* flag system not initialized */ }
}

/**
 * Sequential iframe loading queue.
 *
 * Embed widgets (prototype, story) that lack snapshots call `requestSlot()`
 * which returns a promise that resolves when it's their turn to load.
 * Only one iframe loads at a time — the next starts when the previous
 * calls the returned `release()` function (or on timeout).
 *
 * This prevents the "iframe stampede" when many embeds lack snapshots
 * and would otherwise all try to load simultaneously.
 */
const SLOT_TIMEOUT = 15_000

let _queue = []
let _active = false

function processQueue() {
  if (_active || _queue.length === 0) return
  _active = true
  const { resolve, label } = _queue.shift()
  devLog(`slot granted → ${label} (${_queue.length} queued)`)

  let released = false
  const release = () => {
    if (released) return
    released = true
    _active = false
    devLog(`slot released ← ${label}`)
    processQueue()
  }

  // Safety timeout — if the iframe never signals load, release after 15s
  setTimeout(release, SLOT_TIMEOUT)
  resolve(release)
}

function requestSlot(label = '?') {
  return new Promise((resolve) => {
    _queue.push({ resolve, label })
    devLog(`queued ${label} (position ${_queue.length})`)
    processQueue()
  })
}

/**
 * Hook for embed widgets that need sequential iframe loading.
 *
 * When the widget has a usable snapshot, this is a no-op (returns ready immediately).
 * When no snapshot exists, it queues the widget and returns `ready: true` when
 * it's this widget's turn.
 *
 * @param {boolean} hasUsableSnapshot - whether the widget has a working snapshot
 * @param {string} [label] - debug label for dev logs
 * @returns {{ ready: boolean, releaseSlot: Function }}
 */
export function useIframeQueue(hasUsableSnapshot, label = '?') {
  const [ready, setReady] = useState(hasUsableSnapshot)
  const releaseRef = useRef(null)

  useEffect(() => {
    if (hasUsableSnapshot || ready) return

    let cancelled = false
    requestSlot(label).then((release) => {
      if (cancelled) {
        release()
        return
      }
      releaseRef.current = release
      setReady(true)
    })

    return () => {
      cancelled = true
      releaseRef.current?.()
    }
  }, [hasUsableSnapshot]) // eslint-disable-line react-hooks/exhaustive-deps

  // Release the slot when the component unmounts
  const releaseSlot = useCallback(() => {
    releaseRef.current?.()
    releaseRef.current = null
  }, [])

  return { ready, releaseSlot }
}
