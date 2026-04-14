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
import styles from './StoryWidget.module.css'
import overlayStyles from './embedOverlay.module.css'

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

export default forwardRef(function StoryWidget({ props, onUpdate, resizable }, ref) {
  const storyId = props?.storyId || ''
  const exportName = props?.exportName || ''
  const width = props?.width
  const height = props?.height

  const containerRef = useRef(null)
  const [interactive, setInteractive] = useState(false)
  const [showCode, setShowCode] = useState(false)
  const [sourceCode, setSourceCode] = useState(null)
  const [highlightedHtml, setHighlightedHtml] = useState(null)
  const [sourceLoading, setSourceLoading] = useState(false)

  const handleResize = useCallback((w, h) => {
    onUpdate?.({ width: w, height: h })
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

  // Load source code when show-code is toggled on
  useEffect(() => {
    if (!showCode || sourceCode !== null) return
    const story = getStoryData(storyId)
    if (!story?._storyModule) {
      Promise.resolve().then(() => setSourceCode('// Source not available'))
      return
    }

    let cancelled = false
    Promise.resolve().then(() => { if (!cancelled) setSourceLoading(true) })

    // Use dynamic import with ?raw to get the file contents as a string.
    // Vite's ?raw suffix returns a module whose default export is the raw text.
    import(/* @vite-ignore */ `${resolveModulePath(story._storyModule)}?raw`)
      .then((mod) => {
        if (cancelled) return
        setSourceCode(mod.default || '// Empty file')
      })
      .catch(() => { if (!cancelled) setSourceCode('// Failed to load source') })
      .finally(() => { if (!cancelled) setSourceLoading(false) })

    return () => { cancelled = true }
  }, [showCode, sourceCode, storyId])

  // Syntax-highlight source code using the inspector highlighter.
  // Re-runs when source changes to pick up the current theme from getColors().
  useEffect(() => {
    if (!sourceCode) return
    let cancelled = false
    createInspectorHighlighter().then((hl) => {
      if (cancelled) return
      const lang = storyId.endsWith('.tsx') ? 'tsx' : 'jsx'
      // Detect dark mode from the canvas wrapper's Primer attributes
      const isDark = containerRef.current?.closest('[data-color-mode]')?.getAttribute('data-color-mode') === 'dark'
        || window.matchMedia?.('(prefers-color-scheme: dark)').matches
      // Temporarily set the code-theme attribute so the highlighter picks the right palette
      const prev = document.documentElement.getAttribute('data-sb-code-theme')
      document.documentElement.setAttribute('data-sb-code-theme', isDark ? 'dark' : 'light')
      const html = hl.codeToHtml(sourceCode, { lang })
      if (prev != null) document.documentElement.setAttribute('data-sb-code-theme', prev)
      else document.documentElement.removeAttribute('data-sb-code-theme')
      setHighlightedHtml(html)
    })
    return () => { cancelled = true }
  }, [sourceCode, storyId])

  const copyCode = useCallback(async () => {
    if (sourceCode) {
      await navigator.clipboard?.writeText(sourceCode)
      return
    }
    // Load source on demand if not already loaded
    const story = getStoryData(storyId)
    if (!story?._storyModule) return
    try {
      const mod = await import(/* @vite-ignore */ `${resolveModulePath(story._storyModule)}?raw`)
      const code = mod.default || ''
      setSourceCode(code)
      await navigator.clipboard?.writeText(code)
    } catch { /* ignore */ }
  }, [sourceCode, storyId])

  useImperativeHandle(ref, () => ({
    handleAction(actionId) {
      if (actionId === 'show-code') {
        setShowCode((v) => !v)
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
  }), [storyId, copyCode])

  const iframeSrc = useMemo(
    () => resolveStoryUrl(storyId, exportName),
    [storyId, exportName],
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
              <iframe
                src={iframeSrc}
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
