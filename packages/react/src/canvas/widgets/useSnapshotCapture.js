/**
 * useSnapshotCapture — parent-side capture orchestration hook.
 *
 * Listens for snapshot-ready signals from an embedded iframe and
 * provides a requestCapture() function that triggers a single capture
 * of whatever the iframe is currently showing.
 *
 * Saves a single `snapshot` prop — overwritten every time.
 * Only active in dev mode (when onUpdate is provided).
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { uploadImage } from '../canvasApi.js'

const CAPTURE_TIMEOUT = 3000

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
  showIframe,
}) {
  const [iframeReady, setIframeReady] = useState(false)
  const iframeReadyRef = useRef(false)
  const capturingRef = useRef(false)
  const requestIdCounter = useRef(0)
  const captureGeneration = useRef(0)
  const responseHandlers = useRef([])
  // Track the iframe contentWindow to reset readiness on remount
  const lastContentWindowRef = useRef(null)

  // Reset ready state when iframe is unmounted/remounted
  useEffect(() => {
    setIframeReady(false)
    iframeReadyRef.current = false
  }, [widgetId])

  // Reset readiness when iframe is torn down so remount waits for new snapshot-ready
  useEffect(() => {
    if (!showIframe) {
      setIframeReady(false)
      iframeReadyRef.current = false
      lastContentWindowRef.current = null
    }
  }, [showIframe])

  // Listen for postMessage events from the embedded iframe
  useEffect(() => {
    if (!onUpdate) return

    function handler(e) {
      if (!iframeRef.current) return
      if (e.source !== iframeRef.current.contentWindow) return

      // Detect new iframe instance → reset readiness
      if (e.source !== lastContentWindowRef.current) {
        lastContentWindowRef.current = e.source
        setIframeReady(false)
        iframeReadyRef.current = false
      }

      if (e.data?.type === 'storyboard:embed:snapshot-ready') {
        setIframeReady(true)
        iframeReadyRef.current = true
      }

      if (e.data?.type === 'storyboard:embed:snapshot') {
        for (const fn of responseHandlers.current) {
          fn(e.data)
        }
      }
    }

    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [iframeRef, onUpdate])

  /**
   * Capture a single snapshot of the current iframe state.
   * Uploads and saves as `snapshot` prop, overwriting any previous value.
   */
  const requestCapture = useCallback(async ({ force = false } = {}) => {
    if (!onUpdate) return {}
    if (!iframeRef.current?.contentWindow) return {}
    if (capturingRef.current) return {}
    if (!force && !iframeReadyRef.current) return {}

    capturingRef.current = true
    const gen = ++captureGeneration.current
    const cw = iframeRef.current.contentWindow
    const base = (import.meta.env?.BASE_URL || '/').replace(/\/$/, '')

    try {
      const reqId = ++requestIdCounter.current
      const dataUrl = await captureOnce(cw, reqId, responseHandlers.current)

      if (gen !== captureGeneration.current) return {}
      if (!dataUrl) return {}

      const filename = `snapshot-${widgetId}.webp`
      const result = await uploadImage(dataUrl, `snapshot-${widgetId}`, filename)

      if (gen !== captureGeneration.current) return {}

      if (result?.filename) {
        const cacheBust = `?v=${Date.now()}`
        const url = `${base}/_storyboard/canvas/images/${result.filename}${cacheBust}`
        const updates = { snapshot: url }
        onUpdate?.(updates)
        return updates
      }
      return {}
    } catch (err) {
      console.warn('[snapshot] Capture failed:', err)
      return {}
    } finally {
      capturingRef.current = false
    }
  }, [onUpdate, iframeRef, widgetId])

  return { iframeReady, requestCapture }
}
