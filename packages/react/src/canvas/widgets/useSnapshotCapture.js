/**
 * useSnapshotCapture — parent-side capture orchestration hook.
 *
 * Listens for snapshot-ready signals from an embedded iframe and
 * provides a requestCapture() function that triggers a capture,
 * uploads the resulting image, and persists the URL via onUpdate.
 *
 * Only active in dev mode (when onUpdate is provided).
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { uploadImage } from '../canvasApi.js'

const CAPTURE_TIMEOUT = 5000

export function useSnapshotCapture({
  iframeRef,
  widgetId,
  onUpdate,
  canvasTheme,
}) {
  const [iframeReady, setIframeReady] = useState(false)
  const iframeReadyRef = useRef(false)
  const capturingRef = useRef(false)
  const requestIdCounter = useRef(0)
  const pendingRef = useRef(null)
  const captureResolveRef = useRef(null)

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
        handleSnapshotResponse(e.data)
      }
    }

    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [iframeRef, onUpdate]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSnapshotResponse({ requestId, dataUrl, error }) {
    if (requestId !== pendingRef.current) return // stale response
    pendingRef.current = null

    if (error || !dataUrl) {
      console.warn('[snapshot] Capture failed:', error)
      capturingRef.current = false
      captureResolveRef.current?.()
      captureResolveRef.current = null
      return
    }

    try {
      const filename = `snapshot-${widgetId}--latest.webp`
      const result = await uploadImage(dataUrl, `snapshot-${widgetId}`, filename)
      if (result?.filename) {
        const themeKey = canvasTheme?.startsWith('dark') ? 'snapshotDark' : 'snapshotLight'
        const cacheBust = `?v=${Date.now()}`
        const base = (import.meta.env?.BASE_URL || '/').replace(/\/$/, '')
        onUpdate?.({ [themeKey]: `${base}/_storyboard/canvas/images/${result.filename}${cacheBust}` })
      }
    } catch (err) {
      console.warn('[snapshot] Upload failed:', err)
    } finally {
      capturingRef.current = false
      captureResolveRef.current?.()
      captureResolveRef.current = null
    }
  }

  /**
   * Trigger a snapshot capture. Returns a promise that resolves
   * when the capture completes (or times out).
   */
  const requestCapture = useCallback(() => {
    if (!onUpdate) return Promise.resolve()
    if (!iframeRef.current?.contentWindow) return Promise.resolve()
    if (capturingRef.current) return Promise.resolve()
    if (!iframeReadyRef.current) return Promise.resolve()

    capturingRef.current = true
    const requestId = ++requestIdCounter.current
    pendingRef.current = requestId

    iframeRef.current.contentWindow.postMessage({
      type: 'storyboard:embed:capture',
      requestId,
    }, '*')

    return new Promise((resolve) => {
      captureResolveRef.current = resolve
      // Timeout guard — don't hang if iframe never responds
      setTimeout(() => {
        if (pendingRef.current === requestId) {
          capturingRef.current = false
          pendingRef.current = null
          captureResolveRef.current = null
          resolve()
        }
      }, CAPTURE_TIMEOUT)
    })
  }, [onUpdate, iframeRef, widgetId, canvasTheme]) // eslint-disable-line react-hooks/exhaustive-deps

  return { iframeReady, requestCapture }
}
