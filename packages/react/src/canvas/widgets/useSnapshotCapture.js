/**
 * useSnapshotCapture — parent-side capture orchestration hook.
 *
 * Listens for snapshot-ready signals from an embedded iframe and
 * provides a requestCapture() function that triggers a capture.
 *
 * Performs TRUE dual-theme capture: captures current theme, then
 * tells the iframe to switch theme (hidden via visibility:hidden),
 * captures the alternate theme, and switches back. The user never
 * sees the theme flash because the iframe is hidden during the switch.
 *
 * Only active in dev mode (when onUpdate is provided).
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { uploadImage } from '../canvasApi.js'

const CAPTURE_TIMEOUT = 3000
const THEME_SWITCH_TIMEOUT = 2000

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

/**
 * Tell the iframe to switch its Primer theme and wait for confirmation.
 */
function switchTheme(iframeContentWindow, theme, requestId, listeners) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      cleanup()
      resolve(false)
    }, THEME_SWITCH_TIMEOUT)

    function cleanup() {
      clearTimeout(timer)
      const idx = listeners.indexOf(handler)
      if (idx !== -1) listeners.splice(idx, 1)
    }

    function handler(data) {
      if (data.requestId !== requestId) return
      cleanup()
      resolve(true)
    }

    listeners.push(handler)
    iframeContentWindow.postMessage({
      type: 'storyboard:embed:set-theme',
      theme,
      requestId,
    }, '*')
  })
}

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
  // Handlers for both snapshot and theme-applied responses
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

      if (e.data?.type === 'storyboard:embed:snapshot' ||
          e.data?.type === 'storyboard:embed:theme-applied') {
        for (const fn of responseHandlers.current) {
          fn(e.data)
        }
      }
    }

    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [iframeRef, onUpdate]) // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Dual-theme capture. Captures current theme, then hides iframe,
   * switches to alternate theme, captures again, switches back.
   * Returns { snapshotLight, snapshotDark } URLs.
   * @param {Object} opts
   * @param {boolean} opts.force - Skip the iframeReady guard (use when iframe is known to be loaded)
   */
  const requestCapture = useCallback(async ({ force = false } = {}) => {
    if (!onUpdate) return {}
    if (!iframeRef.current?.contentWindow) return {}
    if (capturingRef.current) return {}
    if (!force && !iframeReadyRef.current) return {}

    capturingRef.current = true
    const cw = iframeRef.current.contentWindow
    const iframe = iframeRef.current
    const base = (import.meta.env?.BASE_URL || '/').replace(/\/$/, '')
    const updates = {}
    const currentTheme = canvasTheme || 'light'
    const isCurrentDark = currentTheme.startsWith('dark')
    const alternateTheme = isCurrentDark ? 'light' : 'dark'

    try {
      // 1. Capture current theme (iframe is visible, user sees current state)
      const currentKey = isCurrentDark ? 'snapshotDark' : 'snapshotLight'
      const currentReqId = ++requestIdCounter.current
      const currentDataUrl = await captureOnce(cw, currentReqId, responseHandlers.current)

      if (currentDataUrl) {
        const filename = `snapshot-${widgetId}--${isCurrentDark ? 'dark' : 'light'}.webp`
        const result = await uploadImage(currentDataUrl, `snapshot-${widgetId}`, filename)
        if (result?.filename) {
          const cacheBust = `?v=${Date.now()}`
          updates[currentKey] = `${base}/_storyboard/canvas/images/${result.filename}${cacheBust}`
          // Publish immediately so the snapshot img is ready before iframe hides
          onUpdate?.({ [currentKey]: updates[currentKey] })
          await new Promise(resolve => {
            const img = new Image()
            img.onload = resolve
            img.onerror = resolve
            img.src = updates[currentKey]
            setTimeout(resolve, 2000)
          })
        }
      }

      // 2. Hide iframe, switch theme, capture alternate (snapshot now visible behind)
      const savedVisibility = iframe.style.visibility
      iframe.style.visibility = 'hidden'

      const switchReqId = ++requestIdCounter.current
      const switched = await switchTheme(cw, alternateTheme, switchReqId, responseHandlers.current)

      if (switched) {
        const altKey = isCurrentDark ? 'snapshotLight' : 'snapshotDark'
        const altReqId = ++requestIdCounter.current
        const altDataUrl = await captureOnce(cw, altReqId, responseHandlers.current)

        if (altDataUrl) {
          const filename = `snapshot-${widgetId}--${isCurrentDark ? 'light' : 'dark'}.webp`
          const result = await uploadImage(altDataUrl, `snapshot-${widgetId}`, filename)
          if (result?.filename) {
            const cacheBust = `?v=${Date.now()}`
            updates[altKey] = `${base}/_storyboard/canvas/images/${result.filename}${cacheBust}`
          }
        }

        // 3. Switch back to original theme
        const switchBackReqId = ++requestIdCounter.current
        await switchTheme(cw, currentTheme, switchBackReqId, responseHandlers.current)
      }

      // 4. Restore iframe visibility
      iframe.style.visibility = savedVisibility || ''

      if (Object.keys(updates).length > 0) {
        onUpdate?.(updates)
      }
      return updates
    } catch (err) {
      // Always restore visibility on error
      if (iframe) iframe.style.visibility = ''
      console.warn('[snapshot] Capture failed:', err)
      return {}
    } finally {
      capturingRef.current = false
    }
  }, [onUpdate, iframeRef, widgetId, canvasTheme]) // eslint-disable-line react-hooks/exhaustive-deps

  return { iframeReady, requestCapture }
}
