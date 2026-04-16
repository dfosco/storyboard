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
 * Optimized pipeline: the first theme's upload runs in parallel with
 * the alternate theme's capture, and capture generation tokens prevent
 * stale results from overwriting newer snapshots.
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

/**
 * Upload a captured dataUrl and return the resolved image URL.
 */
async function uploadAndResolve(dataUrl, widgetId, themeLabel, base) {
  const filename = `snapshot-${widgetId}--${themeLabel}.webp`
  const result = await uploadImage(dataUrl, `snapshot-${widgetId}`, filename)
  if (result?.filename) {
    const cacheBust = `?v=${Date.now()}`
    return `${base}/_storyboard/canvas/images/${result.filename}${cacheBust}`
  }
  return null
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
  // Generation token — incremented on each capture request to detect stale results
  const captureGeneration = useRef(0)
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
  }, [iframeRef, onUpdate])

  /**
   * Dual-theme capture with pipelined uploads.
   *
   * Pipeline: capture theme-1 → start upload-1 in parallel with
   * (hide iframe → switch theme → capture theme-2) → upload-2.
   *
   * Generation tokens prevent stale captures from overwriting newer ones.
   *
   * @param {Object} opts
   * @param {boolean} opts.force - Skip the iframeReady guard
   */
  const requestCapture = useCallback(async ({ force = false } = {}) => {
    if (!onUpdate) return {}
    if (!iframeRef.current?.contentWindow) return {}
    if (capturingRef.current) return {}
    if (!force && !iframeReadyRef.current) return {}

    capturingRef.current = true
    const gen = ++captureGeneration.current
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
      const currentLabel = isCurrentDark ? 'dark' : 'light'
      const currentReqId = ++requestIdCounter.current
      const currentDataUrl = await captureOnce(cw, currentReqId, responseHandlers.current)

      // Bail if a newer capture started while we were waiting
      if (gen !== captureGeneration.current) return {}

      // 2. Start upload of theme-1 in parallel with alternate-theme capture
      const uploadPromise1 = currentDataUrl
        ? uploadAndResolve(currentDataUrl, widgetId, currentLabel, base)
        : Promise.resolve(null)

      // Publish theme-1 immediately so snapshot img is ready before iframe hides
      if (currentDataUrl) {
        uploadPromise1.then(url => {
          if (url && gen === captureGeneration.current) {
            updates[currentKey] = url
            onUpdate?.({ [currentKey]: url })
          }
        }).catch(() => {})
      }

      // 3. Hide iframe, switch theme, capture alternate — overlaps with upload-1
      const savedVisibility = iframe.style.visibility
      iframe.style.visibility = 'hidden'

      const switchReqId = ++requestIdCounter.current
      const switched = await switchTheme(cw, alternateTheme, switchReqId, responseHandlers.current)

      if (gen !== captureGeneration.current) {
        iframe.style.visibility = savedVisibility || ''
        return {}
      }

      if (switched) {
        const altKey = isCurrentDark ? 'snapshotLight' : 'snapshotDark'
        const altLabel = isCurrentDark ? 'light' : 'dark'
        const altReqId = ++requestIdCounter.current
        const altDataUrl = await captureOnce(cw, altReqId, responseHandlers.current)

        if (gen !== captureGeneration.current) {
          iframe.style.visibility = savedVisibility || ''
          return {}
        }

        if (altDataUrl) {
          const altUrl = await uploadAndResolve(altDataUrl, widgetId, altLabel, base)
          if (altUrl && gen === captureGeneration.current) {
            updates[altKey] = altUrl
          }
        }

        // 4. Switch back to original theme
        const switchBackReqId = ++requestIdCounter.current
        await switchTheme(cw, currentTheme, switchBackReqId, responseHandlers.current)
      }

      // Ensure upload-1 is complete before final update
      await uploadPromise1

      // 5. Restore iframe visibility
      iframe.style.visibility = savedVisibility || ''

      if (gen === captureGeneration.current && Object.keys(updates).length > 0) {
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
  }, [onUpdate, iframeRef, widgetId, canvasTheme])

  return { iframeReady, requestCapture }
}
