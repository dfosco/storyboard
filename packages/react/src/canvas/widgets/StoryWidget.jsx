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
import { getStoryData } from '@dfosco/storyboard-core'
import { createInspectorHighlighter } from '@dfosco/storyboard-core/inspector/highlighter'
import WidgetWrapper from './WidgetWrapper.jsx'
import ResizeHandle from './ResizeHandle.jsx'
import { useIframeDevLogs } from './iframeDevLogs.js'
import { useSnapshotCapture } from './useSnapshotCapture.js'
import { subscribeCanvasTheme } from './embedTheme.js'
import { enqueueRefresh, cancelRefresh } from './refreshQueue.js'
import styles from './StoryWidget.module.css'
import overlayStyles from './embedOverlay.module.css'

function ComponentIcon({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M5.21173 15.1113L2.52473 12.4243C2.29041 12.1899 2.29041 11.8101 2.52473 11.5757L5.21173 8.88873C5.44605 8.65442 5.82595 8.65442 6.06026 8.88873L8.74727 11.5757C8.98158 11.8101 8.98158 12.1899 8.74727 12.4243L6.06026 15.1113C5.82595 15.3456 5.44605 15.3456 5.21173 15.1113Z" />
      <path d="M11.5757 21.475L8.88874 18.788C8.65443 18.5537 8.65443 18.1738 8.88874 17.9395L11.5757 15.2525C11.8101 15.0182 12.19 15.0182 12.4243 15.2525L15.1113 17.9395C15.3456 18.1738 15.3456 18.5537 15.1113 18.788L12.4243 21.475C12.19 21.7094 11.8101 21.7094 11.5757 21.475Z" />
      <path d="M11.5757 8.7475L8.88874 6.06049C8.65443 5.82618 8.65443 5.44628 8.88874 5.21197L11.5757 2.52496C11.8101 2.29065 12.19 2.29065 12.4243 2.52496L15.1113 5.21197C15.3456 5.44628 15.3456 5.82618 15.1113 6.06049L12.4243 8.7475C12.19 8.98181 11.8101 8.98181 11.5757 8.7475Z" />
      <path d="M17.9396 15.1113L15.2526 12.4243C15.0183 12.1899 15.0183 11.8101 15.2526 11.5757L17.9396 8.88873C18.174 8.65442 18.5539 8.65442 18.7882 8.88873L21.4752 11.5757C21.7095 11.8101 21.7095 12.1899 21.4752 12.4243L18.7882 15.1113C18.5539 15.3456 18.174 15.3456 17.9396 15.1113Z" />
    </svg>
  )
}

function resolveStoryUrl(storyId, exportName) {
  const story = getStoryData(storyId)
  if (!story?._route) return null

  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
  const route = story._route
  const params = new URLSearchParams({ _sb_embed: '1', _sb_theme_target: 'prototype' })
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
  const snapshot = props?.snapshot || props?.snapshotLight || props?.snapshotDark || ''

  const containerRef = useRef(null)
  const iframeRef = useRef(null)
  const resizeTimerRef = useRef(null)
  const captureOnReadyRef = useRef(false)
  const exitSessionRef = useRef(0)
  const refreshResolveRef = useRef(null)
  const [interactive, setInteractive] = useState(false)
  const [showIframe, setShowIframe] = useState(false)
  const [iframeLoaded, setIframeLoaded] = useState(false)
  const [showCode, setShowCode] = useState(!!props?.showCode)
  const [sourceCode, setSourceCode] = useState(null)
  const [highlightedHtml, setHighlightedHtml] = useState(null)
  const [sourceLoading, setSourceLoading] = useState(false)
  const [storyIndexKey, setStoryIndexKey] = useState(0)
  const [brokenSnaps, setBrokenSnaps] = useState({})

  // Resolve canvas theme — reactive to theme changes
  const [canvasTheme, setCanvasTheme] = useState('light')

  useEffect(() => subscribeCanvasTheme({
    anchorRef: containerRef,
    onTheme: setCanvasTheme,
  }), [])

  // On canvas theme change, enqueue a background snapshot refresh
  const canvasThemeInitRef = useRef(true)
  useEffect(() => {
    if (canvasThemeInitRef.current) { canvasThemeInitRef.current = false; return }
    if (!onUpdate || interactive) return
    enqueueRefresh(widgetId, () => {
      return new Promise((resolve) => {
        refreshResolveRef.current = resolve
        captureOnReadyRef.current = true
        setShowIframe(true)
        setTimeout(() => { refreshResolveRef.current = null; resolve() }, 10000)
      })
    })
  }, [canvasTheme]) // eslint-disable-line react-hooks/exhaustive-deps

  // Snapshot capture hook
  const { iframeReady, requestCapture } = useSnapshotCapture({
    iframeRef,
    widgetId,
    onUpdate,
  })

  // Single snapshot
  const hasSnap = !!(snapshot && snapshot.includes(widgetId) && !brokenSnaps[snapshot])

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

  const enterInteractive = useCallback(() => {
    exitSessionRef.current++
    cancelRefresh(widgetId)
    setShowIframe(true)
    setInteractive(true)
  }, [widgetId])

  useEffect(() => {
    if (!showIframe) setIframeLoaded(false)
  }, [showIframe])

  // Exit interactive mode when clicking outside.
  // Hides iframe immediately for a responsive feel, then captures
  // snapshots in the background with the iframe hidden but still mounted.
  useEffect(() => {
    if (!interactive) return
    function handlePointerDown(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        const chromeEl = e.target.closest(`[data-widget-id="${widgetId}"]`)
        if (chromeEl) return

        setInteractive(false)
        if (onUpdate && iframeLoaded && iframeRef.current?.contentWindow) {
          if (iframeRef.current) iframeRef.current.style.visibility = 'hidden'
          const session = ++exitSessionRef.current
          setTimeout(() => {
            if (exitSessionRef.current !== session) return
            requestCapture({ force: true }).then((updates) => {
              if (exitSessionRef.current !== session) return
              const snap = updates?.snapshot
              if (snap) {
                const img = new Image()
                const done = () => {
                  if (exitSessionRef.current === session) setShowIframe(false)
                }
                img.onload = done
                img.onerror = done
                img.src = snap
                setTimeout(done, 2000)
              } else {
                setShowIframe(false)
              }
            })
          }, 0)
        } else {
          setShowIframe(false)
        }
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [interactive, onUpdate, iframeLoaded, requestCapture])

  const handleResize = useCallback((w, h) => {
    onUpdate?.({ width: w, height: h })
    // Recapture snapshot after resize (debounced)
    clearTimeout(resizeTimerRef.current)
    resizeTimerRef.current = setTimeout(() => requestCapture(), 1500)
  }, [onUpdate, requestCapture])

  // Capture snapshot on first iframe ready (when no existing snapshot)
  useEffect(() => {
    if (!iframeReady || !onUpdate) return
    if (!hasSnap) {
      requestCapture()
    }
  }, [iframeReady]) // eslint-disable-line react-hooks/exhaustive-deps

  // Capture when iframe becomes ready after refresh-thumbnail requested it
  useEffect(() => {
    if (iframeReady && captureOnReadyRef.current) {
      captureOnReadyRef.current = false
      requestCapture().then((updates) => {
        const resolve = refreshResolveRef.current
        if (resolve) {
          refreshResolveRef.current = null
          const snap = updates?.snapshot
          if (snap) {
            const img = new Image()
            const done = () => setShowIframe(false)
            img.onload = done
            img.onerror = done
            img.src = snap
            setTimeout(done, 2000)
          } else {
            setShowIframe(false)
          }
          resolve()
        }
      })
    }
  }, [iframeReady, requestCapture])

  // Cleanup resize timer on unmount
  useEffect(() => () => clearTimeout(resizeTimerRef.current), [])

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
      } else if (actionId === 'refresh-thumbnail') {
        if (iframeReady && iframeRef.current?.contentWindow) {
          requestCapture()
        } else {
          captureOnReadyRef.current = true
          setShowIframe(true)
        }
      }
    },
  }), [storyId, showCode, toggleShowCode, copyCode, iframeReady, requestCapture])

  const iframeSrc = useMemo(
    () => resolveStoryUrl(storyId, exportName),
    [storyId, exportName, storyIndexKey],
  )

  useIframeDevLogs({
    widget: 'StoryWidget',
    loaded: showIframe && !showCode && Boolean(iframeSrc),
    src: iframeSrc,
  })

  const displayName = exportName ? `${storyId} / ${exportName}` : storyId

  // Error state — missing story or no route
  if (!storyId) {
    return (
      <WidgetWrapper>
        <div className={styles.container} ref={containerRef}>
          <div className={styles.error}>
            <span className={styles.errorIcon}><ComponentIcon size={20} /></span>
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
            <span className={styles.errorIcon}><ComponentIcon size={20} /></span>
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
          <span className={styles.headerIcon}><ComponentIcon size={16} /></span>
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
            <div className={styles.content}>
              {/* Snapshot layer — single image */}
              {hasSnap && (
                <img
                  src={snapshot}
                  className={styles.snapshotImage}
                  alt={`${displayName} snapshot`}
                  draggable={false}
                  onError={() => setBrokenSnaps(prev => ({ ...prev, [snapshot]: true }))}
                />
              )}

              {/* Iframe layer — on top, transparent until loaded */}
              {showIframe && (
                <iframe
                  ref={iframeRef}
                  src={iframeSrc}
                  className={styles.iframe}
                  style={{
                    ...(iframeLoaded ? undefined : { opacity: 0 }),
                    transition: 'opacity 150ms ease',
                  }}
                  onLoad={() => setIframeLoaded(true)}
                  title={displayName}
                />
              )}

              {/* Placeholder — only when no snapshot and no iframe */}
              {!hasSnap && !showIframe && (
                <div className={styles.placeholder} />
              )}
            </div>

            {!interactive && (
              <div
                className={overlayStyles.interactOverlay}
                onClick={(e) => {
                  if (e.shiftKey || e.metaKey || e.ctrlKey || e.altKey) return
                  enterInteractive()
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    e.stopPropagation()
                    enterInteractive()
                  }
                }}
                aria-label={hasSnap ? 'Click to interact with story component' : 'Click to open story component'}
              >
                <span className={overlayStyles.interactHint}>{hasSnap ? 'Click to interact' : 'Click to open'}</span>
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
