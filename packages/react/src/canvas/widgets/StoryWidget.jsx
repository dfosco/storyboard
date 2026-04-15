/**
 * Renders a story at its route URL inside an iframe on canvas.
 *
 * Works like PrototypeEmbed: the story has its own route (e.g. /components/button-patterns)
 * and this widget iframes that URL with ?export=ExportName&_sb_embed for single-export mode.
 *
 * Features:
 * - Title bar showing story name + export (like Figma embed)
 * - "Show code" action toggles between iframe and source view
 * - "Copy code" action copies the story source to clipboard
 *
 * Props: { storyId, exportName, width, height }
 */
import { forwardRef, useImperativeHandle, useRef, useCallback, useState, useEffect, useMemo } from 'react'
import { getStoryData, getFlag } from '@dfosco/storyboard-core'
import { createInspectorHighlighter } from '@dfosco/storyboard-core/inspector/highlighter'
import WidgetWrapper from './WidgetWrapper.jsx'
import ResizeHandle from './ResizeHandle.jsx'
import { uploadImage } from '../canvasApi.js'
import styles from './StoryWidget.module.css'
import overlayStyles from './embedOverlay.module.css'

function devLog(...args) {
  try { if (getFlag('dev-logs')) console.log('[canvas:story-widget]', ...args) } catch { /* */ }
}

function resolveStoryUrl(storyId, exportName) {
  const story = getStoryData(storyId)
  if (!story?._route) return null

  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
  const route = story._route
  const params = new URLSearchParams({ _sb_embed: '1' })
  if (exportName) params.set('export', exportName)

  return `${base}${route}?${params}`
}

/** Resolve a module path with the app base URL for dynamic imports. */
function resolveModulePath(modulePath) {
  if (!modulePath || !modulePath.startsWith('/')) return modulePath
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
  return base ? `${base}${modulePath}` : modulePath
}

/** Cache for the static story sources JSON fetched in prod builds. */
let _storySourcesCache = null

/**
 * Fetch story source code. In dev, uses Vite's ?raw dynamic import.
 * In prod, fetches from the build-time _storyboard/stories/sources.json.
 */
async function fetchStorySource(modulePath) {
  // Dev: use Vite's ?raw import for live source
  if (import.meta.env.DEV) {
    const mod = await import(/* @vite-ignore */ `${resolveModulePath(modulePath)}?raw`)
    return mod.default || ''
  }

  // Prod: load from static JSON endpoint (same pattern as inspector.json)
  if (!_storySourcesCache) {
    const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
    const res = await fetch(`${base}/_storyboard/stories/sources.json`)
    if (!res.ok) throw new Error(`Story sources not available (${res.status})`)
    _storySourcesCache = await res.json()
  }

  // _storyModule is like "/src/canvas/stories/foo.story.jsx" — strip leading /
  const key = modulePath.startsWith('/') ? modulePath.slice(1) : modulePath
  const source = _storySourcesCache[key]
  if (source == null) throw new Error(`Source not found for ${key}`)
  return source
}

export default forwardRef(function StoryWidget({ id: widgetId, props, onUpdate, resizable }, ref) {
  const storyId = props?.storyId || ''
  const exportName = props?.exportName || ''
  const width = props?.width
  const height = props?.height

  // Snapshot props for lazy loading
  const snapshotLight = props?.snapshotLight || null
  const snapshotDark = props?.snapshotDark || null

  const containerRef = useRef(null)
  const iframeRef = useRef(null)
  const [interactive, setInteractive] = useState(false)
  const [showCode, setShowCode] = useState(!!props?.showCode)
  const [sourceCode, setSourceCode] = useState(null)
  const [highlightedHtml, setHighlightedHtml] = useState(null)
  const [sourceLoading, setSourceLoading] = useState(false)

  // Theme tracking for snapshot selection
  const [canvasTheme, setCanvasTheme] = useState(() => {
    if (typeof localStorage === 'undefined') return 'light'
    const stored = localStorage.getItem('sb-color-scheme') || 'system'
    if (stored !== 'system') return stored
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    function onThemeChanged() {
      const stored = localStorage.getItem('sb-color-scheme') || 'system'
      if (stored !== 'system') { setCanvasTheme(stored); return }
      setCanvasTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    }
    document.addEventListener('storyboard:theme:changed', onThemeChanged)
    return () => document.removeEventListener('storyboard:theme:changed', onThemeChanged)
  }, [])

  // Lazy loading state — only use snapshots that match this widget's ID
  const isDark = canvasTheme?.startsWith('dark')
  const snapshotMatchesWidget = (url) => url && widgetId && url.includes(widgetId)
  const validSnapshotLight = snapshotMatchesWidget(snapshotLight) ? snapshotLight : null
  const validSnapshotDark = snapshotMatchesWidget(snapshotDark) ? snapshotDark : null
  const currentSnapshot = isDark ? validSnapshotDark : validSnapshotLight
  const hasSnapshot = !!currentSnapshot

  // Lazy loading — iframe starts on 0.5s hover or click
  const [preloadIframe, setPreloadIframe] = useState(hasSnapshot)
  const [iframeLoaded, setIframeLoaded] = useState(false)
  const [showIframe, setShowIframe] = useState(hasSnapshot)
  const [showSpinner, setShowSpinner] = useState(false)
  const capturingRef = useRef(false)
  const hoverTimerRef = useRef(null)

  devLog(widgetId, { hasSnapshot, preloadIframe, showIframe, iframeLoaded, storyId })

  // Click-to-interact: immediately start iframe
  const activateIframe = useCallback(() => {
    devLog(widgetId, 'user activated → loading iframe')
    clearTimeout(hoverTimerRef.current)
    setShowIframe(true)
    setPreloadIframe(true)
  }, [widgetId])

  // Hover handlers — 0.5s dwell triggers iframe load
  const onHoverEnter = useCallback(() => {
    if (preloadIframe && showIframe) return
    clearTimeout(hoverTimerRef.current)
    devLog(widgetId, 'hover enter (starting 500ms timer)')
    hoverTimerRef.current = setTimeout(() => {
      devLog(widgetId, 'hover 500ms → loading iframe')
      setPreloadIframe(true)
      setShowIframe(true)
    }, 500)
  }, [preloadIframe, showIframe, widgetId])

  const onHoverLeave = useCallback(() => {
    if (hoverTimerRef.current) {
      devLog(widgetId, 'hover leave (short hover, cancelled)')
      clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = null
    }
  }, [widgetId])

  useEffect(() => () => clearTimeout(hoverTimerRef.current), [])

  // Show spinner only after 500ms of loading
  useEffect(() => {
    if (showIframe && !iframeLoaded && hasSnapshot) {
      const timer = setTimeout(() => setShowSpinner(true), 500)
      return () => clearTimeout(timer)
    }
    setShowSpinner(false)
  }, [showIframe, iframeLoaded, hasSnapshot])
  const [storyIndexKey, setStoryIndexKey] = useState(0)

  // Re-resolve story URL when the story index is live-patched (new story added)
  useEffect(() => {
    const handler = () => setStoryIndexKey((k) => k + 1)
    document.addEventListener('storyboard:story-index-changed', handler)
    return () => document.removeEventListener('storyboard:story-index-changed', handler)
  }, [])

  const toggleShowCode = useCallback(() => {
    setShowCode((v) => {
      const next = !v
      // Persist to canvas JSONL in dev
      if (onUpdate) {
        onUpdate({ showCode: next })
      }
      return next
    })
  }, [onUpdate])

  const enterInteractive = useCallback(() => setInteractive(true), [])

  useEffect(() => {
    if (!interactive) return
    function handlePointerDown(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setInteractive(false)
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [interactive])

  // Listen for snapshot messages from the iframe
  useEffect(() => {
    function handleMessage(e) {
      if (!iframeRef.current?.contentWindow) return
      if (e.source !== iframeRef.current.contentWindow) return

      if (e.data?.type === 'storyboard:embed:snapshot') {
        if (e.data.error) {
          console.warn('[canvas] Story snapshot capture failed:', e.data.error)
          return
        }
        handleSnapshotResult(e.data.dataUrl)
        return
      }

      // snapshot-ready means the iframe content has fully rendered
      if (e.data?.type === 'storyboard:embed:snapshot-ready') {
        setIframeLoaded(true)
        if (onUpdate) requestSnapshotCapture()
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [onUpdate, canvasTheme])

  const requestSnapshotCapture = useCallback(() => {
    if (!iframeRef.current?.contentWindow || capturingRef.current) return
    capturingRef.current = true
    iframeRef.current.contentWindow.postMessage({
      type: 'storyboard:embed:capture',
      requestId: `story-snap-${Date.now()}`,
    }, '*')
  }, [])

  const handleSnapshotResult = useCallback(async (dataUrl) => {
    if (!dataUrl || !onUpdate || !widgetId) return
    capturingRef.current = false
    try {
      const result = await uploadImage(dataUrl, `snapshot-${widgetId}`)
      if (!result?.success || !result?.filename) return
      const imageUrl = `/_storyboard/canvas/images/${result.filename}`
      const themeKey = isDark ? 'snapshotDark' : 'snapshotLight'
      onUpdate?.({ [themeKey]: imageUrl })
    } catch (err) {
      console.warn('[canvas] Failed to upload story snapshot:', err)
    }
  }, [onUpdate, isDark, widgetId])

  // Re-capture after resize
  const resizeCaptureTimer = useRef(null)
  const triggerResizeCapture = useCallback(() => {
    if (!onUpdate) return
    clearTimeout(resizeCaptureTimer.current)
    resizeCaptureTimer.current = setTimeout(() => requestSnapshotCapture(), 2000)
  }, [requestSnapshotCapture, onUpdate])

  const handleResize = useCallback((w, h) => {
    onUpdate?.({ width: w, height: h })
    triggerResizeCapture()
  }, [onUpdate, triggerResizeCapture])

  // Re-capture for alternate theme variant when theme changes
  const prevThemeRef = useRef(canvasTheme)
  useEffect(() => {
    if (canvasTheme !== prevThemeRef.current && onUpdate && showIframe) {
      prevThemeRef.current = canvasTheme
      const timer = setTimeout(() => requestSnapshotCapture(), 3000)
      return () => clearTimeout(timer)
    }
    prevThemeRef.current = canvasTheme
  }, [canvasTheme, onUpdate, showIframe, requestSnapshotCapture])

  // Load source code when show-code is toggled on
  useEffect(() => {
    if (!showCode || sourceCode !== null) return
    const story = getStoryData(storyId)
    if (!story?._storyModule) {
      setSourceCode('// Source not available')
      return
    }

    let cancelled = false
    setSourceLoading(true)

    fetchStorySource(story._storyModule)
      .then((code) => {
        if (cancelled) return
        setSourceCode(code || '// Empty file')
        setSourceLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setSourceCode('// Failed to load source')
        setSourceLoading(false)
      })

    return () => {
      cancelled = true
      setSourceLoading(false)
    }
  }, [showCode, sourceCode, storyId])

  // Re-highlight when the code-box theme changes (storyboard:theme:changed event).
  const [codeThemeKey, setCodeThemeKey] = useState(0)
  useEffect(() => {
    function onThemeChanged() {
      setCodeThemeKey((k) => k + 1)
    }
    document.addEventListener('storyboard:theme:changed', onThemeChanged)
    return () => document.removeEventListener('storyboard:theme:changed', onThemeChanged)
  }, [])

  // Syntax-highlight source code using the inspector highlighter.
  // Uses the current code-box theme (data-sb-code-theme) set by the theme store.
  useEffect(() => {
    if (!sourceCode) return
    let cancelled = false
    createInspectorHighlighter().then((hl) => {
      if (cancelled) return
      const lang = storyId.endsWith('.tsx') ? 'tsx' : 'jsx'
      const html = hl.codeToHtml(sourceCode, { lang })
      setHighlightedHtml(html)
    })
    return () => { cancelled = true }
  }, [sourceCode, storyId, codeThemeKey])

  const copyCode = useCallback(async () => {
    if (sourceCode) {
      await navigator.clipboard?.writeText(sourceCode)
      return
    }
    // Load source on demand if not already loaded
    const story = getStoryData(storyId)
    if (!story?._storyModule) return
    try {
      const code = await fetchStorySource(story._storyModule)
      setSourceCode(code)
      await navigator.clipboard?.writeText(code)
    } catch { /* ignore */ }
  }, [sourceCode, storyId])

  useImperativeHandle(ref, () => ({
    getState(key) {
      if (key === 'showCode') return showCode
      return undefined
    },
    handleAction(actionId) {
      if (actionId === 'show-code') {
        toggleShowCode()
      } else if (actionId === 'copy-code') {
        copyCode()
      } else if (actionId === 'open-external') {
        const story = getStoryData(storyId)
        if (story?._route) {
          const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
          window.open(`${base}${story._route}`, '_blank', 'noopener')
        }
      }
    },
  }), [storyId, showCode, toggleShowCode, copyCode])

  const iframeSrc = useMemo(
    () => resolveStoryUrl(storyId, exportName),
    [storyId, exportName, storyIndexKey],
  )

  const displayName = exportName ? `${storyId} / ${exportName}` : storyId

  // Error state — missing story or no route
  if (!storyId) {
    return (
      <WidgetWrapper>
        <div className={styles.container} ref={containerRef}>
          <div className={styles.error}>
            <span className={styles.errorIcon}>📖</span>
            <span className={styles.errorText}>Missing story ID</span>
          </div>
        </div>
      </WidgetWrapper>
    )
  }

  if (!iframeSrc) {
    return (
      <WidgetWrapper>
        <div className={styles.container} ref={containerRef}>
          <div className={styles.error}>
            <span className={styles.errorIcon}>📖</span>
            <span className={styles.errorText}>Story &ldquo;{storyId}&rdquo; not found or has no route</span>
          </div>
        </div>
      </WidgetWrapper>
    )
  }

  const sizeStyle = {}
  if (typeof width === 'number') sizeStyle.width = `${width}px`
  if (typeof height === 'number') sizeStyle.height = `${height}px`

  return (
    <WidgetWrapper>
      <div ref={containerRef} className={styles.container} style={sizeStyle}>
        <div className={styles.header}>
          <span className={styles.headerIcon}>📖</span>
          <span className={styles.headerTitle}>{displayName}</span>
        </div>
        {showCode ? (
          <div
            className={styles.codeView}
            data-canvas-allow-text-selection
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.codeHeader}>
              <span className={styles.codeLabel}>{storyId}.story.jsx</span>
              <button
                className={styles.codeCloseBtn}
                onClick={() => setShowCode(false)}
                aria-label="Close code view"
              >×</button>
            </div>
            {sourceLoading ? (
              <div className={styles.codeLoading}>Loading…</div>
            ) : highlightedHtml ? (
              <div
                className={styles.codeBlock}
                dangerouslySetInnerHTML={{ __html: highlightedHtml }}
              />
            ) : (
              <pre className={styles.codeBlock}>
                <code>{sourceCode || ''}</code>
              </pre>
            )}
          </div>
        ) : (
          <>
            {/* Snapshot image — shown until iframe is fully loaded */}
            {hasSnapshot && !(showIframe && iframeLoaded) && (
              <div className={styles.content}>
                <img
                  src={(import.meta.env.BASE_URL || '/').replace(/\/$/, '') + currentSnapshot}
                  alt={displayName}
                  className={styles.snapshotImage}
                  draggable={false}
                />
                {showIframe && !iframeLoaded && showSpinner && (
                  <div className={styles.snapshotSpinner}>
                    <div className={styles.spinner} />
                  </div>
                )}
              </div>
            )}

            {/* Iframe — preloaded on hover, revealed after load */}
            {(preloadIframe || showIframe) && (
              <div
                className={styles.content}
                style={hasSnapshot && !(showIframe && iframeLoaded) ? { position: 'absolute', top: 31, left: 0, right: 0, bottom: 0, opacity: 0, pointerEvents: 'none' } : undefined}
              >
                <iframe
                  ref={iframeRef}
                  src={iframeSrc}
                  className={styles.iframe}
                  title={displayName}
                />
              </div>
            )}

            {!interactive && (
              <div
                className={overlayStyles.interactOverlay}
                onPointerEnter={onHoverEnter}
                onPointerLeave={onHoverLeave}
                onClick={(e) => {
                  if (e.shiftKey || e.metaKey || e.ctrlKey || e.altKey) return
                  activateIframe()
                  enterInteractive()
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    e.stopPropagation()
                    activateIframe()
                    enterInteractive()
                  }
                }}
                aria-label="Click to interact with story component"
              >
                <span className={overlayStyles.interactHint}>Click to interact</span>
              </div>
            )}
          </>
        )}
        {resizable && (
          <ResizeHandle
            targetRef={containerRef}
            minWidth={100}
            minHeight={60}
            onResize={handleResize}
          />
        )}
      </div>
    </WidgetWrapper>
  )
})
