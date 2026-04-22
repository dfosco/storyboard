/**
 * Renders a story at its route URL inside an iframe on canvas.
 *
 * Features:
 * - Title bar showing story name + export
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
import styles from './StoryWidget.module.css'
import overlayStyles from './embedOverlay.module.css'

function ComponentIcon({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M5.21173 15.1113L2.52473 12.4243C2.29041 12.1899 2.29041 11.8101 2.52473 11.5757L5.21173 8.88873C5.44605 8.65442 5.82595 8.65442 6.06026 8.88873L8.74727 11.5757C8.98158 11.8101 8.98158 12.1899 8.74727 12.4243L6.06026 15.1113C5.82595 15.3456 5.44605 15.3456 5.21173 15.1113Z" />
      <path d="M11.5757 21.475L8.88874 18.788C8.65443 18.5537 8.65443 18.1738 8.88874 17.9395L11.5757 15.2525C11.8101 15.0182 12.19 15.0182 12.4243 15.2525L15.1113 17.9395C15.3456 18.1738 15.3456 18.5537 15.1113 18.788L12.4243 21.475C12.19 21.7094 11.8101 21.7094 11.5757 21.475Z" />
      <path d="M17.9395 15.1113L15.2525 12.4243C15.0182 12.1899 15.0182 11.8101 15.2525 11.5757L17.9395 8.88873C18.1738 8.65442 18.5537 8.65442 18.788 8.88873L21.475 11.5757C21.7094 11.8101 21.7094 12.1899 21.475 12.4243L18.788 15.1113C18.5537 15.3456 18.1738 15.3456 17.9395 15.1113Z" />
      <path d="M11.5757 8.74727L8.88874 6.06026C8.65443 5.82595 8.65443 5.44605 8.88874 5.21173L11.5757 2.52473C11.8101 2.29041 12.19 2.29041 12.4243 2.52473L15.1113 5.21173C15.3456 5.44605 15.3456 5.82595 15.1113 6.06026L12.4243 8.74727C12.19 8.98158 11.8101 8.98158 11.5757 8.74727Z" />
    </svg>
  )
}

function resolveStoryUrl(storyId, exportName) {
  const story = getStoryData(storyId)
  if (!story?._route) return ''
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
  const params = new URLSearchParams()
  if (exportName) params.set('export', exportName)
  params.set('_sb_embed', '')
  params.set('_sb_hide_branch_bar', '')
  return `${base}${story._route}?${params}`
}

const _storySourcesCache = {}

async function fetchStorySource(modulePath) {
  if (modulePath in _storySourcesCache) return _storySourcesCache[modulePath]
  const url = modulePath.startsWith('/') ? modulePath : `/${modulePath}`
  const res = await fetch(`${url}?raw`)
  if (!res.ok) throw new Error(`Failed to fetch ${url}`)
  const code = await res.text()
  _storySourcesCache[modulePath] = code
  return code
}

export default forwardRef(function StoryWidget({ id: widgetId, props, onUpdate, resizable }, ref) {
  const storyId = props?.storyId || ''
  const exportName = props?.exportName || ''
  const width = props?.width
  const height = props?.height

  const containerRef = useRef(null)
  const iframeRef = useRef(null)
  const [interactive, setInteractive] = useState(false)
  const [showCode, setShowCode] = useState(!!props?.showCode)
  const [sourceCode, setSourceCode] = useState(null)
  const [highlightedHtml, setHighlightedHtml] = useState(null)
  const [sourceLoading, setSourceLoading] = useState(false)
  const [storyIndexKey, setStoryIndexKey] = useState(0)

  // Re-resolve story URL when the story index is live-patched
  useEffect(() => {
    const handler = () => setStoryIndexKey((k) => k + 1)
    document.addEventListener('storyboard:story-index-changed', handler)
    return () => document.removeEventListener('storyboard:story-index-changed', handler)
  }, [])

  const toggleShowCode = useCallback(() => {
    setShowCode((v) => {
      const next = !v
      if (onUpdate) onUpdate({ showCode: next })
      return next
    })
  }, [onUpdate])

  const enterInteractive = useCallback(() => setInteractive(true), [])

  // Exit interactive mode when clicking outside
  useEffect(() => {
    if (!interactive) return
    function handlePointerDown(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        const chromeEl = e.target.closest(`[data-widget-id="${widgetId}"]`)
        if (chromeEl) return
        setInteractive(false)
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [interactive, widgetId])

  const handleResize = useCallback((w, h) => {
    onUpdate?.({ width: w, height: h })
  }, [onUpdate])

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
      .then((code) => { if (!cancelled) { setSourceCode(code || '// Empty file'); setSourceLoading(false) } })
      .catch(() => { if (!cancelled) { setSourceCode('// Failed to load source'); setSourceLoading(false) } })
    return () => { cancelled = true; setSourceLoading(false) }
  }, [showCode, sourceCode, storyId])

  // Re-highlight when theme changes
  const [codeThemeKey, setCodeThemeKey] = useState(0)
  useEffect(() => {
    function onThemeChanged() { setCodeThemeKey((k) => k + 1) }
    document.addEventListener('storyboard:theme:changed', onThemeChanged)
    return () => document.removeEventListener('storyboard:theme:changed', onThemeChanged)
  }, [])

  // Syntax-highlight source code
  useEffect(() => {
    if (!sourceCode) return
    let cancelled = false
    createInspectorHighlighter().then((hl) => {
      if (cancelled) return
      const lang = storyId.endsWith('.tsx') ? 'tsx' : 'jsx'
      setHighlightedHtml(hl.codeToHtml(sourceCode, { lang }))
    })
    return () => { cancelled = true }
  }, [sourceCode, storyId, codeThemeKey])

  const copyCode = useCallback(async () => {
    if (sourceCode) { await navigator.clipboard?.writeText(sourceCode); return }
    const story = getStoryData(storyId)
    if (!story?._storyModule) return
    try {
      const code = await fetchStorySource(story._storyModule)
      setSourceCode(code)
      await navigator.clipboard?.writeText(code)
    } catch { /* */ }
  }, [sourceCode, storyId])

  useImperativeHandle(ref, () => ({
    getState(key) {
      if (key === 'showCode') return showCode
      return undefined
    },
    handleAction(actionId) {
      if (actionId === 'show-code') toggleShowCode()
      else if (actionId === 'copy-code') copyCode()
      else if (actionId === 'open-external') {
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

  // When paused and not interactive, freeze the iframe src to prevent reloads
  const effectiveSrc = iframeSrc

  useIframeDevLogs({
    widget: 'StoryWidget',
    loaded: interactive && !showCode && Boolean(effectiveSrc),
    src: effectiveSrc,
  })

  const displayName = exportName ? `${storyId} / ${exportName}` : storyId

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

  if (!effectiveSrc) {
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
              <button className={styles.codeCloseBtn} onClick={() => setShowCode(false)} aria-label="Close code view">×</button>
            </div>
            {sourceLoading ? (
              <div className={styles.codeLoading}>Loading…</div>
            ) : highlightedHtml ? (
              <div className={styles.codeBlock} dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
            ) : (
              <pre className={styles.codeBlock}><code>{sourceCode || ''}</code></pre>
            )}
          </div>
        ) : (
          <>
            <div className={styles.content}>
              <iframe
                ref={iframeRef}
                src={effectiveSrc}
                className={styles.iframe}
                title={displayName}
              />
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
                aria-label="Click to interact"
              >
                <span className={overlayStyles.interactHint}>Click to interact</span>
              </div>
            )}
          </>
        )}
      </div>
      {resizable && <ResizeHandle targetRef={containerRef} width={width} height={height} onResize={handleResize} />}
    </WidgetWrapper>
  )
})
