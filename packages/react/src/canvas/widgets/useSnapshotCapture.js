/**
 * useSnapshotCapture — parent-side capture orchestration hook.
 *
 * Listens for snapshot-ready signals from an embedded iframe and
 * provides a requestCapture() function that triggers a capture,
 * uploads the resulting image, and persists the URL via onUpdate.
 *
 * Captures BOTH light and dark theme snapshots on every capture
 * so the correct thumbnail is always available when the theme changes.
 *
 * Only active in dev mode (when onUpdate is provided).
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { uploadImage } from '../canvasApi.js'

const CAPTURE_TIMEOUT = 5000

/**
 * Run a single capture request against the iframe.
 * Returns the dataUrl or null on failure.
 */
function captureOnce(iframeContentWindow, requestId, listeners) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      cleanup()
      resolve(null)
    }, CAPTURE_TIMEOUT)

    function cleanup() {
      clearTimeout(timer)
      const idx = listeners.indexOf(handler)
      if (idx !== -1) listeners.splice(idx, 1)
    }

    function handler(data) {
      if (data.requestId !== requestId) return
      cleanup()
      if (data.error || !data.dataUrl) {
        if (data.error) console.warn('[snapshot] Capture failed:', data.error)
        resolve(null)
      } else {
        resolve(data.dataUrl)
      }
    }

    listeners.push(handler)
    iframeContentWindow.postMessage({
      type: 'storyboard:embed:capture',
      requestId,
    }, '*')
  })
}

export function useSnapshotCapture({
  iframeRef,
  widgetId,
  onUpdate,
}) {
  const [iframeReady, setIframeReady] = useState(false)
  const iframeReadyRef = useRef(false)
  const capturingRef = useRef(false)
  const requestIdCounter = useRef(0)
  // Array of pending response handlers — allows multiple in-flight
  const responseHandlers = useRef([])

  // Reset ready state when iframe is unmounted/remounted
  useEffect(() => {
    setIframeReady(false)
    iframeReadyRef.current = false
  }, [widgetId])

  // Listen for postMessage events from the embedded iframe
  useEffect(() => {
    if (!onUpdate) return

    function handler(e) {
      if (!iframeRef.current) return
      if (e.source !== iframeRef.current.contentWindow) return

      if (e.data?.type === 'storyboard:embed:snapshot-ready') {
        setIframeReady(true)
        iframeReadyRef.current = true
      }

      if (e.data?.type === 'storyboard:embed:snapshot') {
        // Dispatch to all pending capture handlers
        for (const fn of responseHandlers.current) {
          fn(e.data)
        }
      }
    }

    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [iframeRef, onUpdate]) // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Trigger a snapshot capture. Captures the current iframe state once
   * and stores the URL under BOTH snapshotLight and snapshotDark keys
   * so a thumbnail is always available regardless of canvas theme.
   * Returns the updates object with the snapshot URLs.
   */
  const requestCapture = useCallback(async () => {
    if (!onUpdate) return {}
    if (!iframeRef.current?.contentWindow) return {}
    if (capturingRef.current) return {}
    if (!iframeReadyRef.current) return {}

    capturingRef.current = true
    const cw = iframeRef.current.contentWindow
    const base = (import.meta.env?.BASE_URL || '/').replace(/\/$/, '')
    const updates = {}

    try {
      const requestId = ++requestIdCounter.current
      const dataUrl = await captureOnce(cw, requestId, responseHandlers.current)

      if (dataUrl) {
        const filename = `snapshot-${widgetId}--latest.webp`
        const result = await uploadImage(dataUrl, `snapshot-${widgetId}`, filename)
        if (result?.filename) {
          const cacheBust = `?v=${Date.now()}`
          const url = `${base}/_storyboard/canvas/images/${result.filename}${cacheBust}`
          // Store under both keys so thumbnail is always available
          updates.snapshotLight = url
          updates.snapshotDark = url
        }
      }

      if (Object.keys(updates).length > 0) {
        onUpdate?.(updates)
      }
      return updates
    } catch (err) {
      console.warn('[snapshot] Capture failed:', err)
      return {}
    } finally {
      capturingRef.current = false
    }
  }, [onUpdate, iframeRef, widgetId]) // eslint-disable-line react-hooks/exhaustive-deps

  return { iframeReady, requestCapture }
}
